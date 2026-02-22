const HIGH_SCHOOL_LABELS: Record<string, string> = {
  public: "Public HS",
  private: "Private HS",
  charter: "Charter",
  magnet: "Magnet",
  homeschool: "Homeschool",
  international: "International",
};

export interface SubmissionTagInput {
  highSchoolType: string | null;
  geographicClassification: string | null;
  firstGeneration: boolean | null;
  legacyStatus: boolean | null;
  apCoursesCount: number | null;
  ibCoursesCount: number | null;
  honorsCoursesCount: number | null;
}

export function buildContextTags(submission: SubmissionTagInput): string[] {
  const contextTags: string[] = [];

  if (submission.highSchoolType && HIGH_SCHOOL_LABELS[submission.highSchoolType]) {
    contextTags.push(HIGH_SCHOOL_LABELS[submission.highSchoolType]);
  }
  if (submission.geographicClassification) {
    contextTags.push(
      submission.geographicClassification.charAt(0).toUpperCase() +
        submission.geographicClassification.slice(1)
    );
  }
  if (submission.firstGeneration) contextTags.push("First-Gen");
  if (submission.legacyStatus) contextTags.push("Legacy");
  if (submission.apCoursesCount !== null && submission.apCoursesCount > 0) {
    contextTags.push(`${submission.apCoursesCount} APs`);
  }
  if (submission.ibCoursesCount !== null && submission.ibCoursesCount > 0) {
    contextTags.push(`${submission.ibCoursesCount} IBs`);
  }
  if (submission.honorsCoursesCount !== null && submission.honorsCoursesCount > 0) {
    contextTags.push(`${submission.honorsCoursesCount} Honors`);
  }

  return contextTags;
}
