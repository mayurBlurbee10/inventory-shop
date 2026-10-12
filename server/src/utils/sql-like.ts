// Prisma's `contains` becomes `LIKE CONCAT('%', @P, '%')` on SQL Server, where `[` opens a character class
// (it was a literal character on PostgreSQL). Wrap it as `[[]` so searches like "Soda [12pk]" still match literally.
export function escapeLikeBrackets(term: string): string {
    return term.replace(/\[/g, "[[]");
}
