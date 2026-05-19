import "reflect-metadata";

interface HubSpotFormField {
  objectTypeId: string;
  name: string;
  value: string;
}

interface HubSpotFormSubmission {
  fields: HubSpotFormField[];
  context?: {
    hutk?: string;
    pageUri?: string;
    pageName?: string;
  };
}

interface HubSpotContactSearch {
  filterGroups: Array<{
    filters: Array<{
      propertyName: string;
      operator: string;
      value: string;
    }>;
  }>;
  properties: string[];
  limit: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Default: max 4 retries, exponential backoff on 429 (1s, 2s, 4s, 8s) or Retry-After header. */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 4
): Promise<Response> {
  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    lastResponse = res;
    if (res.status !== 429) return res;
    if (attempt === maxRetries) return res;
    const retryAfter = res.headers.get("Retry-After");
    const waitMs = retryAfter
      ? Math.min(Number(retryAfter) * 1000, 30000)
      : Math.min(1000 * 2 ** attempt, 30000);
    await sleep(waitMs);
  }
  return lastResponse!;
}

class HubSpotService {
  private readonly formSubmissionUrl = process.env.HUBSPOT_FORM_SUBMISSION_URL!;
  // "https://api.hsforms.com/submissions/v3/integration/secure/submit/244793242/cbaf1a10-6d06-4ccb-8af9-5a8b18a5575c";
  
  private readonly apiKey = process.env.HUBSPOT_API_KEY!; 
    // "pat-na2-6ce1f3fc-760d-4df9-a511-ee07c2103c73";

  /** Throttle: min delay between HubSpot API calls (ms). ~500ms => ~2 ops/sec (search+delete) => under 5 req/sec. */
  private readonly throttleMs = 500;

  /**
   * Submit business form data to HubSpot
   */
  async submitBusinessForm(data: {
    applicationId: string;
    userId: string;
    businessNumber: string;
    businessDescription: string;
    ownershipPercentage: string;
    isControlledPrivateCorporation: string;
    yearsInBusiness: string;
    industry: string;
    totalEmployees: string;
    hutk?: string;
    email?: string;
    pageUri?: string;
    pageName?: string;
  }): Promise<any> {
    try {
      const fields: HubSpotFormField[] = [
        {
          objectTypeId: "0-1",
          name: "email",
          value: data.email || "",
        },
        {
          objectTypeId: "0-1",
          name: "user_id",
          value: data.userId,
        },
        {
          objectTypeId: "0-1",
          name: "application_id",
          value: data.applicationId,
        },
        {
          objectTypeId: "0-1",
          name: "business_number",
          value: data.businessNumber || "",
        },
        {
          objectTypeId: "0-1",
          name: "business_description",
          value: data.businessDescription || "",
        },
        {
          objectTypeId: "0-1",
          name: "your_ownership_percentage",
          value: data.ownershipPercentage || "",
        },
        {
          objectTypeId: "0-1",
          name: "is_your_company_controlled_private_corporation",
          value: data.isControlledPrivateCorporation || "",
        },
        {
          objectTypeId: "0-1",
          name: "how_many_years_has_your_company_been_in_business",
          value: data.yearsInBusiness || "",
        },
        {
          objectTypeId: "0-1",
          name: "what_industry_do_you_operate_in",
          value: data.industry || "",
        },
        {
          objectTypeId: "0-1",
          name: "total_number_of_employees",
          value: data.totalEmployees || "",
        },
      ];

      const payload: HubSpotFormSubmission = {
        fields,
      };

      // Add context if hutk is provided
      if (data.hutk || data.pageUri || data.pageName) {
        payload.context = {};
        if (data.hutk) {
          payload.context.hutk = data.hutk;
        }
        if (data.pageUri) {
          payload.context.pageUri = data.pageUri;
        }
        if (data.pageName) {
          payload.context.pageName = data.pageName;
        }
      }

      const response = await fetch(this.formSubmissionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HubSpot form submission failed: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error("HubSpot API Error:", error.message);
      throw {
        message: error.message,
        source: "hubspot",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Search for contact by user_id in HubSpot
   */
  async searchContactByUserId(userId: string, applicationId?: string, properties?: string[]): Promise<any> {
    try {
      const searchUrl = "https://api.hubapi.com/crm/v3/objects/contacts/search";
      const filters: any[] = [
        {
          propertyName: "user_id",
          operator: "EQ",
          value: userId,
        },
      ];
      if (applicationId) {
        filters.push({
          propertyName: "application_id",
          operator: "EQ",
          value: applicationId,
        });
      }

      const payload: HubSpotContactSearch = {
        filterGroups: [
          {
            filters,
          },
        ],
        properties: properties || ["user_id", "application_id", "business_description", "business_number", "your_ownership_percentage", "is_your_company_controlled_private_corporation", "how_many_years_has_your_company_been_in_business", "what_industry_do_you_operate_in", "total_number_of_employees"],
        limit: 10,
      };

      const response = await fetchWithRetry(searchUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HubSpot contact search failed: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error("HubSpot API Error:", error.message);
      throw {
        message: error.message,
        source: "hubspot",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Delete a HubSpot contact by ID (with retry on 429).
   */
  async deleteContactById(contactId: string): Promise<void> {
    const deleteUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;

    const response = await fetchWithRetry(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HubSpot contact delete failed: ${response.status} - ${errorText}`
      );
    }
  }

  /**
   * Search for contact by userId + applicationId, then delete it. No-op if not found.
   */
  async deleteContactByUserAndApplication(
    userId: string,
    applicationId: string
  ): Promise<void> {
    const searchResult = await this.searchContactByUserId(userId, applicationId);
    if (!searchResult.results || searchResult.results.length === 0) {
      return;
    }

    const contactId = searchResult.results[0].id as string;
    await this.deleteContactById(contactId);
  }

  /**
   * Delete HubSpot contacts for many user/application pairs with throttling and retry.
   * Processes one at a time with delay between each to stay under HubSpot's per-second limit.
   */
  async deleteContactsByUserAndApplicationBatch(
    entries: Array<{ userId: string; applicationId: string }>
  ): Promise<void> {
    for (const { userId, applicationId } of entries) {
      try {
        await this.deleteContactByUserAndApplication(userId, applicationId);
      } catch (err) {
        console.warn(
          `HubSpot: could not delete contact for user ${userId} / application ${applicationId}:`,
          err instanceof Error ? err.message : String(err)
        );
      }
      await sleep(this.throttleMs);
    }
  }
}

export default new HubSpotService();

