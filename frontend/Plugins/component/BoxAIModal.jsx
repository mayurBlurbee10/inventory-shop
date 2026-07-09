import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Trash2,
  ArrowUp,
  BrainCog,
  ChevronDown,
  ChevronUp,
  Link,
  FileText,
  Copy,
} from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { sanitizeName } from "../../src/lib/helper.js";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/app/lib/utils";

/** Collapse whitespace / underscores for comparing Box citation snippets to answer text */
function normalizeForCitationMatch(s) {
  if (!s || typeof s !== "string") return "";
  return s
    .replace(/[\u00a0\u200b\u2028\u2029\ufeff]/g, " ")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\bbenefit by\b/g, "benefit from")
    .replace(/\bcontent management\b/g, "content-management")
    .replace(/\bfile sharing\b/g, "file-sharing");
}

function dedupeCitationsByFile(citations) {
  const map = new Map();
  for (const c of citations) {
    const key = c.id ?? c.name;
    if (key != null && !map.has(String(key))) map.set(String(key), c);
  }
  return [...map.values()];
}

/** Split answer into logical blocks (markdown headings and/or blank-line paragraphs) */
function splitAnswerIntoBlocks(text) {
  if (!text || typeof text !== "string") return [];
  const trimmed = text.trim();
  if (!trimmed) return [];
  let parts = trimmed
    .split(/\n(?=#{1,3}\s)/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (parts.length > 1) return parts;
  parts = trimmed.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return parts.length ? parts : [trimmed];
}

function firstMeaningfulLine(text) {
  for (const line of (text || "").split(/\n/)) {
    const t = line.trim();
    if (t) return t;
  }
  return "";
}

function stripLeadingHeadingMarkers(line) {
  return line
    .replace(/^#{1,3}\s+/, "")
    .replace(/^\*\*/, "")
    .replace(/\*\*$/, "")
    .trim();
}

/** Closing CTA paragraph — never gets a citation link */
function isClosingBlock(text) {
  const t = (text || "").trim();
  return (
    /^would you like\b/i.test(t) ||
    /^do you want\b/i.test(t) ||
    /^shall i\b/i.test(t)
  );
}

/** Block that is the “Key questions” portion of a combined answer */
function isKeyQuestionsSectionBlock(text) {
  const raw = firstMeaningfulLine(text);
  if (!raw) return false;
  const t = stripLeadingHeadingMarkers(raw);
  return /\bkey\s+questions\b/i.test(t);
}

/**
 * Split for display + citations: [MS/overview …] | [Key questions …] | [Would you like…]
 * so one link sits after each substantive part with the right source filter.
 */
function splitAnswerForCitations(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return { blocks: [], usedKeyQuestionSplit: false };
  let working = trimmed.replace(/\r\n/g, "\n");
  let closing = null;
  const closeIdx = working.search(/\nWould you like\b/i);
  if (closeIdx !== -1) {
    closing = working.slice(closeIdx + 1).trim();
    working = working.slice(0, closeIdx).trim();
  }
  const kqRe =
    /\n(?=(?:#{1,3}\s*)?(?:\*\*)?(?:The\s+)?Key\s+Questions\b)/i;
  const kqParts = working.split(kqRe);
  let blocks = [];
  let usedKeyQuestionSplit = false;
  if (kqParts.length >= 2) {
    usedKeyQuestionSplit = true;
    const before = kqParts[0].trim();
    const kqSection = kqParts.slice(1).join("\n").trim();
    if (before) blocks.push(before);
    if (kqSection) blocks.push(kqSection);
  } else {
    blocks = splitAnswerIntoBlocks(working);
  }
  if (closing) blocks.push(closing);
  return {
    blocks: blocks.filter(Boolean),
    usedKeyQuestionSplit,
  };
}

function isKeyQuestionsCitation(c) {
  return /keyquestions/i.test((c && c.name) || "");
}

/** When we split on “Key Questions”, map sources: KQ PDF vs all other cited files */
function assignCitationsToSemanticBlocks(blocks, citations) {
  const kqCits = dedupeCitationsByFile(
    citations.filter((c) => isKeyQuestionsCitation(c))
  );
  const nonKqCits = dedupeCitationsByFile(
    citations.filter((c) => !isKeyQuestionsCitation(c))
  );
  return blocks.map((block) => {
    if (isClosingBlock(block)) return [];
    if (isKeyQuestionsSectionBlock(block)) {
      if (kqCits.length) return kqCits;
      const nb = normalizeForCitationMatch(block);
      const matched = [];
      for (const c of citations) {
        if (
          blockReferencesCitationFile(block, c) ||
          citationExcerptMatchesBlock(c, nb)
        ) {
          matched.push(c);
        }
      }
      return dedupeCitationsByFile(matched);
    }
    const nb = normalizeForCitationMatch(block);
    const matched = [];
    for (const c of nonKqCits) {
      if (blockReferencesCitationFile(block, c) || citationExcerptMatchesBlock(c, nb)) {
        matched.push(c);
      }
    }
    const m = dedupeCitationsByFile(matched);
    return m.length ? m : nonKqCits;
  });
}

function prepareBlocksAndCitations(text, citations) {
  const { blocks, usedKeyQuestionSplit } = splitAnswerForCitations(text);
  if (blocks.length === 0) return { blocks: [], perBlock: [] };
  let perBlock;
  if (usedKeyQuestionSplit) {
    perBlock = assignCitationsToSemanticBlocks(blocks, citations);
  } else {
    perBlock = assignCitationsToBlocks(blocks, citations);
    perBlock = redistributeEdgeBlockCitations(blocks, perBlock);
  }
  return { blocks, perBlock };
}

function renderInlineMarkdown(text, keyPrefix) {
  const input = text ?? "";
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let idx = 0;
  let match = regex.exec(input);
  while (match) {
    if (match.index > last) {
      parts.push(
        <React.Fragment key={`${keyPrefix}-t-${idx++}`}>
          {input.slice(last, match.index)}
        </React.Fragment>
      );
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b-${idx++}`}>{token.slice(2, -2)}</strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={`${keyPrefix}-i-${idx++}`}>{token.slice(1, -1)}</em>
      );
    } else {
      parts.push(
        <React.Fragment key={`${keyPrefix}-u-${idx++}`}>{token}</React.Fragment>
      );
    }
    last = match.index + token.length;
    match = regex.exec(input);
  }
  if (last < input.length) {
    parts.push(
      <React.Fragment key={`${keyPrefix}-e-${idx++}`}>
        {input.slice(last)}
      </React.Fragment>
    );
  }
  return parts.length ? parts : input;
}

function appendCitationInlineToNodes(out, trailingSlot, rawFallback, keyPrefix) {
  if (!trailingSlot) return out;
  if (!out.length) {
    return [
      <p
        key={`${keyPrefix}-inline-fallback`}
        className="leading-relaxed inline-block max-w-full"
      >
        {renderInlineMarkdown(rawFallback || "", `${keyPrefix}-fallback`)}
        {trailingSlot}
      </p>,
    ];
  }
  const last = out[out.length - 1];
  const cls = last.props?.className || "";
  const isUl = last.type === "ul";
  const isP = last.type === "p";
  const isHeading =
    last.type === "div" && /font-semibold/.test(cls) && /text-(2xl|xl|lg)/.test(cls);

  if (isUl) {
    const children = React.Children.toArray(last.props.children);
    if (!children.length) return out;
    const lastIdx = children.length - 1;
    const lastLi = children[lastIdx];
    const newChildren = children.map((child, idx) =>
      idx === lastIdx
        ? React.cloneElement(
          lastLi,
          { className: lastLi.props.className },
          <>
            {lastLi.props.children}
            <span className="inline-flex items-baseline shrink-0">
              {trailingSlot}
            </span>
          </>
        )
        : child
    );
    out[out.length - 1] = React.cloneElement(last, { key: last.key }, newChildren);
    return out;
  }

  if (isP) {
    out[out.length - 1] = React.cloneElement(
      last,
      {
        className: `${cls} inline-block max-w-full`.trim(),
      },
      <>
        {last.props.children}
        <span className="inline-flex items-baseline shrink-0">
          {trailingSlot}
        </span>
      </>
    );
    return out;
  }

  if (isHeading) {
    out[out.length - 1] = React.cloneElement(
      last,
      {
        className: `${cls} flex flex-wrap items-baseline gap-x-1`.trim(),
      },
      <>
        {last.props.children}
        {trailingSlot}
      </>
    );
    return out;
  }

  return [...out, <span key={`${keyPrefix}-trail`}>{trailingSlot}</span>];
}

function renderMarkdownBlockContent(block, keyPrefix, trailingSlot = null) {
  const raw = block ?? "";
  const lines = raw.split("\n");
  const out = [];
  let i = 0;
  let nodeIndex = 0;

  while (i < lines.length) {
    const current = lines[i]?.trimEnd() ?? "";
    const trimmed = current.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const cls =
        level === 1
          ? "mb-2 text-2xl font-semibold text-foreground"
          : level === 2
            ? "mb-1.5 text-xl font-semibold text-foreground"
            : "mb-1 text-lg font-semibold text-foreground";
      out.push(
        <div key={`${keyPrefix}-h-${nodeIndex++}`} className={cls}>
          {renderInlineMarkdown(text, `${keyPrefix}-h-${nodeIndex}`)}
        </div>
      );
      i++;
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s+/.test((lines[i] || "").trim())) {
        items.push((lines[i] || "").trim().replace(/^[-*•]\s+/, ""));
        i++;
      }
      out.push(
        <ul
          key={`${keyPrefix}-ul-${nodeIndex++}`}
          className="list-disc pl-5 space-y-1 my-1"
        >
          {items.map((item, itemIdx) => (
            <li key={`${keyPrefix}-li-${itemIdx}`} className="leading-relaxed">
              {renderInlineMarkdown(item, `${keyPrefix}-li-${itemIdx}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const para = [];
    while (i < lines.length) {
      const line = (lines[i] || "").trim();
      if (!line) {
        i++;
        break;
      }
      if (/^(#{1,3})\s+/.test(line) || /^[-*•]\s+/.test(line)) break;
      para.push(line);
      i++;
    }
    if (para.length) {
      out.push(
        <p
          key={`${keyPrefix}-p-${nodeIndex++}`}
          className="leading-relaxed mb-1"
        >
          {renderInlineMarkdown(para.join(" "), `${keyPrefix}-p-${nodeIndex}`)}
        </p>
      );
    }
  }

  if (!out.length) {
    return (
      <p className="leading-relaxed inline-block max-w-full">
        {renderInlineMarkdown(raw, `${keyPrefix}-fallback`)}
        {trailingSlot}
      </p>
    );
  }
  const withTrail = appendCitationInlineToNodes(out, trailingSlot, raw, keyPrefix);
  return withTrail.length === 1 ? withTrail[0] : withTrail;
}

function blockReferencesCitationFile(block, citation) {
  const name = (citation.name || "").trim();
  if (!name) return false;
  const nb = normalizeForCitationMatch(block);
  const nn = normalizeForCitationMatch(name);
  if (nn.length >= 4 && nb.includes(nn)) return true;
  const stem = name.replace(/\.[a-z0-9]+$/i, "");
  const ns = normalizeForCitationMatch(stem);
  if (ns.length >= 4 && nb.includes(ns)) return true;
  const compactBlock = nb.replace(/[^a-z0-9]+/g, "");
  const compactStem = ns.replace(/[^a-z0-9]+/g, "");
  if (compactStem.length >= 6 && compactBlock.includes(compactStem)) return true;
  return false;
}

function citationExcerptMatchesBlock(citation, blockNorm) {
  if (!blockNorm) return false;
  const raw = (citation.content || "").replace(/[\u00a0\u200b\u2028\u2029\ufeff]/g, "\n");
  const full = normalizeForCitationMatch(raw);
  if (full.length >= 14 && blockNorm.includes(full)) return true;
  const lines = raw
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const piece = normalizeForCitationMatch(line);
    if (piece.length < 14) continue;
    if (blockNorm.includes(piece)) return true;
    if (piece.length > 45 && blockNorm.includes(piece.slice(0, 45))) return true;
  }
  return false;
}

/**
 * Map each block to citations (filename mention, excerpt lines, or phrase overlap).
 * Unmatched citations go to the last block so link icons always appear somewhere.
 */
function assignCitationsToBlocks(blocks, citations) {
  if (blocks.length === 0) return [];
  const assigned = blocks.map((block) => {
    const nb = normalizeForCitationMatch(block);
    if (!nb) return [];
    const matched = [];
    for (const c of citations) {
      if (blockReferencesCitationFile(block, c)) {
        matched.push(c);
        continue;
      }
      if (citationExcerptMatchesBlock(c, nb)) matched.push(c);
    }
    return dedupeCitationsByFile(matched);
  });
  const used = new Set();
  assigned.flat().forEach((c) => used.add(String(c.id ?? c.name)));
  const unused = dedupeCitationsByFile(
    citations.filter((c) => !used.has(String(c.id ?? c.name)))
  );
  if (unused.length && assigned.length) {
    const last = assigned.length - 1;
    assigned[last] = dedupeCitationsByFile([...assigned[last], ...unused]);
  }
  return assigned;
}

/** Show one link after a block when it has mapped sources and is not the closing CTA */
function shouldShowCitationLinkForBlock(blockText, citationsForBlock) {
  if (!dedupeCitationsByFile(citationsForBlock || []).length) return false;
  if (isClosingBlock(blockText)) return false;
  return true;
}

/** Move citations off first/last blocks so they still appear on a nearby body block's link. */
function redistributeEdgeBlockCitations(blocks, perBlock) {
  const n = blocks.length;
  const out = perBlock.map((a) => [...(a || [])]);
  if (n >= 3) {
    const fromFirst = out[0] || [];
    out[0] = [];
    out[1] = dedupeCitationsByFile([...(out[1] || []), ...fromFirst]);
    const fromLast = out[n - 1] || [];
    out[n - 1] = [];
    out[n - 2] = dedupeCitationsByFile([...(out[n - 2] || []), ...fromLast]);
    return out;
  }
  if (n === 2) {
    const fromFirst = out[0] || [];
    out[0] = [];
    out[1] = dedupeCitationsByFile([...(out[1] || []), ...fromFirst]);
    return out;
  }
  return out;
}

function fileIdSetKeyFromCitations(citations) {
  return dedupeCitationsByFile(citations || [])
    .map((c) => String(c.id ?? c.name))
    .sort()
    .join("\u0001");
}

function fileIdSetKeyFromIds(ids) {
  return [...(ids || [])].map(String).sort().join("\u0001");
}

/** Keep only one source card per file/document in sidebar */
function dedupeCitationCards(citations) {
  const map = new Map();
  for (const c of citations || []) {
    const key = String(c.id ?? c.name);
    if (!map.has(key)) map.set(key, c);
  }
  return [...map.values()];
}

const BoxAIModal = ({ isOpen, onClose, hubTitle = "test" }) => {
  const [messageCopyied, setMessageCopyied] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hubs, setHubs] = useState([]);
  const [isHubsLoading, setIsHubsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState({});
  const [filteredCitations, setFilteredCitations] = useState({});
  const [lastQuery, setLastQuery] = useState(null);
  const modalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { data: config } = useSelector((state) => state.portal);
  const lastAIErrorMessage = [...messages]
    .reverse()
    .find((msg) => msg.type === "ai" && msg.isError);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  const portalId = sanitizeName(config?.legalName || config?.tradingName);

  const getAllHubs = async () => {
    try {
      setIsHubsLoading(true);
      const res = await fetchWrapper(`/api/plugins/box-ai/hubs?portalId=${portalId}`, {
        method: "GET",
      });
      if (!res.ok) {
        throw new Error("Something went wrong!!");
      }
      const data = await res.json();
      const hubData = data?.data;
      setHubs(hubData);
    } catch (error) {
      toast.error(error?.message);
    } finally {
      setIsHubsLoading(false);
    }
  };

  const handleSearchAI = async (query) => {
    try {
      setIsLoading(true);

      if (!hubs || hubs.length === 0) {
        throw new Error("No hubs available for AI search");
      }

      const items = hubs.map((item) => ({ type: "hubs", id: item?.id }));
      const res = await fetchWrapper(
        `/api/plugins/box-ai/ai-ask?portalId=${portalId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: query,
            items: items,
          }),
        }
      );
      if (!res.ok) {
        throw new Error("Something went wrong!!");
      }
      if (res.headers.get("Content-Length") === "0") {
        return;
      }
      const data = await res.json();
      console.log("AI Response Data:", data);

      if (data && res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            content: data.answer || data,
            citations: data.citations || [],
            answerSegments: data.answerSegments,
            timestamp: new Date(),
          },
        ]);
        setLastQuery(null);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "ai",
            content:
              "Relevant content cannot be found. Please try again later or ask a different question.",
            isError: true,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("AI request error:", error);
      toast.error(error?.message || "Failed to get AI response");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "ai",
          content:
            "Sorry, I encountered an error while processing your request. Please try again.",
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  useEffect(() => {
    if (isOpen && hubs.length === 0) {
      getAllHubs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    const userMessage = message.trim();
    setLastQuery(userMessage);
    setMessage("");
    const newUserMessage = {
      id: Date.now(),
      type: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    await handleSearchAI(userMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setExpandedCitations({});
    setFilteredCitations({});
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const clearMessageCitationFilter = (messageId) => {
    setFilteredCitations((prev) => {
      const next = { ...prev };
      delete next[messageId];
      return next;
    });
  };

  /** One link icon per section: filter Sources to only the files cited for that section (toggle). */
  const toggleSectionSourceFilter = (messageId, citationsForSection) => {
    const list = dedupeCitationsByFile(citationsForSection || []);
    if (list.length === 0) return;
    const nextKey = fileIdSetKeyFromCitations(list);
    setFilteredCitations((prev) => {
      const cur = prev[messageId];
      const curKey = cur?.fileIds?.length
        ? fileIdSetKeyFromIds(cur.fileIds)
        : "";
      const state = { ...prev };
      if (curKey === nextKey) {
        delete state[messageId];
        return state;
      }
      state[messageId] = {
        fileIds: list.map((c) => String(c.id ?? c.name)),
      };
      return state;
    });
  };

  const handleCopyToClipboard = (message, messageId) => {
    navigator.clipboard
      .writeText(message)
      .then(() => {
        setMessageCopyied(messageId);
        setTimeout(() => setMessageCopyied(null), 2000);
        toast.success("Message copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy message");
      });
  };

  const getDisplayCitations = (msg) => {
    if (!msg.citations || msg.citations.length === 0) return [];

    const filterState = filteredCitations[msg.id];
    const allowed = filterState?.fileIds;
    if (!allowed?.length) return dedupeCitationCards(msg.citations);
    const set = new Set(allowed.map(String));
    return dedupeCitationCards(
      msg.citations.filter((c) => set.has(String(c.id ?? c.name)))
    );
  };

  const isSectionFilterActive = (msg, citationsForRow) => {
    const list = dedupeCitationsByFile(citationsForRow || []);
    if (!list.length) return false;
    const cur = filteredCitations[msg.id];
    if (!cur?.fileIds?.length) return false;
    return (
      fileIdSetKeyFromIds(cur.fileIds) === fileIdSetKeyFromCitations(list)
    );
  };

  const toggleExpandCitations = (messageId) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const renderCitationLinkRow = (msg, citationsForRow) => {
    const list = dedupeCitationsByFile(citationsForRow || []);
    if (msg.type !== "ai" || list.length === 0) return null;
    const isActive = isSectionFilterActive(msg, list);
    const names = list.map((c) => c.name || c.hubName || "Source").join(", ");
    const title = isActive
      ? "Show all sources"
      : `Sources for this section (${list.length}): ${names}`;
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => toggleSectionSourceFilter(msg.id, list)}
        className={cn(
          "ml-1 inline-flex shrink-0 align-baseline !px-1 !py-1",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-primary"
        )}
        title={title}
        aria-label={title}
      >
        <Link className="h-3 w-3" />
      </Button>
    );
  };

  const renderAIContentWithCitations = (msg) => {
    const content = msg.content;
    const citations = msg.citations || [];

    if (citations.length === 0) {
      const plainBlocks = splitAnswerIntoBlocks(content);
      return (
        <div className="text-sm space-y-2">
          {plainBlocks.map((block, idx) => (
            <div key={idx}>{renderMarkdownBlockContent(block, `plain-${idx}`)}</div>
          ))}
        </div>
      );
    }

    if (msg.answerSegments && msg.answerSegments.length > 0) {
      const showMultiHeader = msg.answerSegments.length > 1;
      return (
        <>
          {showMultiHeader && (
            <p className="mb-1 text-sm font-medium whitespace-pre-wrap text-foreground">
              Based on the information from {msg.answerSegments.length} hubs:
            </p>
          )}
          {msg.answerSegments.map((seg, idx) => {
            const segCitations = citations.filter(
              (c) => String(c.hubId) === String(seg.hubId)
            );
            const distinctFiles = dedupeCitationsByFile(segCitations);
            const segText =
              msg.answerSegments.length === 1 ? content : seg.text;
            if (distinctFiles.length > 1) {
              const { blocks, perBlock } = prepareBlocksAndCitations(
                segText,
                segCitations
              );
              return (
                <div key={idx} className="mb-3 last:mb-0 space-y-2">
                  {blocks.map((block, bidx) => (
                    <div key={bidx} className="text-sm">
                      {renderMarkdownBlockContent(
                        block,
                        `seg-${idx}-b-${bidx}`,
                        shouldShowCitationLinkForBlock(
                          block,
                          perBlock[bidx] || []
                        )
                          ? renderCitationLinkRow(msg, perBlock[bidx] || [])
                          : null
                      )}
                    </div>
                  ))}
                </div>
              );
            }
            const { blocks: blocksSingle, perBlock: perBlockSingle } =
              prepareBlocksAndCitations(segText, segCitations);
            return (
              <div key={idx} className="mb-2 last:mb-0 space-y-2">
                {blocksSingle.map((block, bidx) => (
                  <div key={bidx} className="text-sm">
                    {renderMarkdownBlockContent(
                      block,
                      `single-${idx}-b-${bidx}`,
                      shouldShowCitationLinkForBlock(
                        block,
                        perBlockSingle[bidx] || []
                      )
                        ? renderCitationLinkRow(msg, perBlockSingle[bidx] || [])
                        : null
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </>
      );
    }

    let body = content;
    if (body.startsWith("Based on the information from")) {
      const lines = body.split("\n");
      let i = 1;
      while (i < lines.length && lines[i].trim() === "") i++;
      body = lines.slice(i).join("\n");
    }

    const { blocks, perBlock } = prepareBlocksAndCitations(body, citations);

    if (blocks.length === 0) {
      return (
        <div className="text-sm">
          {renderMarkdownBlockContent(
            content,
            "fallback-content",
            shouldShowCitationLinkForBlock(content, citations)
              ? renderCitationLinkRow(msg, citations)
              : null
          )}
        </div>
      );
    }

    return (
      <>
        {content.startsWith("Based on the information from") && (
          <p className="mb-1 text-sm font-medium whitespace-pre-wrap text-foreground">
            {content.split("\n")[0]}
          </p>
        )}
        {blocks.map((block, idx) => (
          <div key={idx} className="mb-2 last:mb-0">
            <div className="text-sm">
              {renderMarkdownBlockContent(
                block,
                `body-${idx}`,
                shouldShowCitationLinkForBlock(block, perBlock[idx] || [])
                  ? renderCitationLinkRow(msg, perBlock[idx] || [])
                  : null
              )}
            </div>
          </div>
        ))}
      </>
    );
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-end bg-black/30 transition-opacity duration-300",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          "flex h-full w-full max-w-5xl flex-col overflow-hidden border-border bg-background shadow-2xl transition-all duration-300 ease-in-out lg:rounded-l-[2%]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ maxHeight: "100vh" }}
      >
        <div className="flex items-center justify-between border-b border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <BrainCog className="h-4 w-4 text-primary-solid" />
            <h2 className="text-lg font-semibold text-foreground">Box AI Plugin</h2>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && !isLoading && (
              <Button
                type="button"
                variant="icons"
                size="icon-sm"
                onClick={clearChat}
                className="!px-3 !py-3 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="icons"
              size="icon-sm"
              onClick={onClose}
              className="!px-3 !py-3 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          {isHubsLoading && (
            <div className="flex items-center justify-center py-24">
              <LoaderSpinner size={32} className="text-secondary-foreground" />
            </div>
          )}
          {messages.length === 0 && !isHubsLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="mb-6">
                <BrainCog className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                Welcome to Box AI Plugin
              </h3>
              <Card className="max-w-sm border-border bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Chat cleared when you close this hub
                  </p>
                  {hubs.length > 0 && (
                    <p className="mt-2 text-xs text-success">
                      {hubs.length} hub{hubs.length > 1 ? "s" : ""} loaded and
                      ready for AI search
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="hidden-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
              {messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.type === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-start gap-2",
                      msg.type === "user" ? "max-w-[80%]" : "max-w-full"
                    )}
                  >
                    {msg.type === "ai" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <BrainCog className="h-4 w-4 text-primary-solid" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "w-full",
                        msg.type === "ai" &&
                          msg.citations &&
                          msg.citations.length > 0 &&
                          "flex flex-col md:flex-row md:gap-4"
                      )}
                    >
                      <div
                        className={cn(
                          "relative rounded-lg",
                          msg.citations && msg.citations.length > 0
                            ? "mb-3 md:flex-1 lg:mb-0"
                            : "",
                          msg.type === "user"
                            ? "ml-auto max-w-fit bg-primary px-4 py-2 text-primary-foreground"
                            : msg.isError
                              ? "border border-destructive/30 bg-destructive/10 px-4 py-2 text-destructive"
                              : "border border-border bg-muted/50 px-4 py-2 pr-8 text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "flex flex-col gap-2",
                            msg.type === "ai" &&
                              msg.citations &&
                              msg.citations.length > 0 &&
                              "pb-10 pr-10"
                          )}
                        >
                          {renderAIContentWithCitations(msg)}
                        </div>
                        {msg.type === "ai" && (
                          <div className="absolute bottom-1 right-1 z-10 flex items-center gap-1">
                            {messageCopyied === msg?.id && (
                              <Badge
                                variant="outline"
                                className="animate-fade-in border-success/40 bg-success/10 text-success"
                              >
                                Copied!
                              </Badge>
                            )}
                            <Button
                              type="button"
                              variant="icons"
                              size="icon-sm"
                              onClick={() =>
                                handleCopyToClipboard(msg.content, msg?.id)
                              }
                              className="!px-3 !py-3 text-muted-foreground hover:bg-accent hover:text-foreground"
                              title="Copy to clipboard"
                              aria-label="Copy message to clipboard"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {msg.citations && msg.citations.length > 0 && (
                        <Card className="border-border bg-muted/50 md:max-w-[350px] md:shrink-0 md:self-start">
                          <CardContent className="p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="flex items-center text-xs font-semibold text-foreground">
                                <FileText
                                  className="mr-1 h-3.5 w-3.5"
                                  strokeWidth={1.5}
                                />
                                Sources
                                <Badge
                                  variant="secondary"
                                  className="ml-2 px-1.5 py-0.5 text-xs"
                                >
                                  {getDisplayCitations(msg).length}
                                </Badge>
                                {filteredCitations[msg.id]?.fileIds?.length > 0 && (
                                  <span className="ml-1 text-xs text-primary">
                                    (filtered)
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-2">
                                {filteredCitations[msg.id]?.fileIds?.length > 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      clearMessageCitationFilter(msg.id)
                                    }
                                    className="h-auto !px-3 !py-3 text-xs font-medium text-muted-foreground hover:text-primary"
                                    title="Show all sources"
                                  >
                                    Show All
                                  </Button>
                                )}
                                {getDisplayCitations(msg).length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => toggleExpandCitations(msg.id)}
                                    className="h-auto !px-3 !py-3 text-xs font-medium text-muted-foreground hover:text-primary"
                                  >
                                    {expandedCitations[msg.id] ? (
                                      <>
                                        Show Less
                                        <ChevronUp className="ml-1 h-3 w-3" />
                                      </>
                                    ) : (
                                      <>
                                        View All
                                        <ChevronDown className="ml-1 h-3 w-3" />
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div
                              className={cn(
                                "space-y-2 overflow-y-auto scrollbar-hide",
                                expandedCitations[msg.id]
                                  ? "max-h-auto"
                                  : "max-h-38"
                              )}
                            >
                              {(expandedCitations[msg.id]
                                ? getDisplayCitations(msg)
                                : getDisplayCitations(msg).slice(0, 2)
                              ).map((citation, index) => (
                                <Card
                                  key={index}
                                  className="border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                                >
                                  <CardContent className="p-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                          <div className="h-2 w-2 shrink-0 rounded-full bg-primary-solid" />
                                          <p className="truncate text-xs font-medium leading-tight text-foreground">
                                            {citation.name}
                                          </p>
                                        </div>
                                        {citation.content && (
                                          <p
                                            className="mt-1 pl-4 text-xs leading-relaxed text-muted-foreground"
                                            style={{
                                              display: "-webkit-box",
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: "vertical",
                                              overflow: "hidden",
                                            }}
                                          >
                                            {citation.content
                                              .replace(/_+/g, "")
                                              .trim()}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>

                            {getDisplayCitations(msg).length > 2 && (
                              <div className="mt-2 border-t border-border pt-2 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => toggleExpandCitations(msg.id)}
                                  className="h-auto !px-3 !py-3 text-xs text-muted-foreground hover:text-primary"
                                >
                                  {expandedCitations[msg.id]
                                    ? `Showing all ${getDisplayCitations(msg).length} sources`
                                    : `${getDisplayCitations(msg).length - 2} more sources available`}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <BrainCog className="h-4 w-4 text-primary-solid" />
                    </div>
                    <div className="rounded-lg bg-muted px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          {lastAIErrorMessage && lastQuery && !isLoading && (
            <div className="flex justify-center p-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleSearchAI(lastQuery)}
                className="!px-3 !py-3 text-sm"
              >
                Retry
              </Button>
            </div>
          )}
          <div className="border-t border-border bg-card p-4">
            <div className="relative">
              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      isHubsLoading
                        ? "Loading hubs..."
                        : hubs.length === 0
                          ? "No hubs available"
                          : "Ask Box AI"
                    }
                    disabled={isHubsLoading}
                    className="hidden-scrollbar min-h-[48px] max-h-32 resize-none border-border bg-background pr-12 text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    rows={1}
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading || isHubsLoading}
                    className="absolute bottom-3 right-2 !h-8 !w-8 !rounded-full !px-0 !py-0"
                    aria-label="Send message"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>{message.length}/2000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxAIModal;