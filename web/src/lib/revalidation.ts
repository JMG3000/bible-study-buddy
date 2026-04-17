export const HOME_TAG = "plans:home";
export const PLAN_LIST_TAG = "plans:list";
export const SERIES_LIST_TAG = "series:list";

export function lessonPlanTag(id: string) {
  return `plan:${id}`;
}

export function lessonPlanPath(slug: string) {
  return `/plans/${slug}`;
}

export function studySeriesTag(id: string) {
  return `series:${id}`;
}

export function studySeriesPath(slug: string) {
  return `/series/${slug}`;
}
