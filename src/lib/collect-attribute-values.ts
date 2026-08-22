export type AttributeDefLike = { id: string; type: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" };

/**
 * Reads `attr_<id>` fields out of a submitted form into an attributeId->value
 * map. Booleans always get an explicit "true"/"false" (a missing checkbox
 * key just means unchecked) so unchecking one during an edit actually clears
 * a previously-saved "true" instead of silently leaving it in place.
 */
export function collectAttributeValues(formData: FormData, attributes: AttributeDefLike[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const attr of attributes) {
    const key = `attr_${attr.id}`;
    if (attr.type === "BOOLEAN") {
      result[attr.id] = formData.get(key) === "true" ? "true" : "false";
      continue;
    }
    const value = formData.get(key);
    if (value != null && value !== "") result[attr.id] = String(value);
  }
  return result;
}
