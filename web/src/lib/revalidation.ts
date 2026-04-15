export const HOME_TAG = "plans:home";
export const PLAN_LIST_TAG = "plans:list";

export function lessonPlanTag(id: string) {
  return `plan:${id}`;
}

export function lessonPlanPath(slug: string) {
  return `/plans/${slug}`;
}
