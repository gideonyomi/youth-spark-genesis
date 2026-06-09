// Default evaluation form template — inspired by a standard post-event feedback form.
export const DEFAULT_EVAL_SECTIONS = [
  {
    id: "overall",
    title: "Overall Experience",
    description: "How did the event meet your expectations?",
    fields: [
      { id: "overall_rating", label: "Overall event rating", type: "rating", required: true, scale: 5 },
      { id: "expectations", label: "Did the event meet your expectations?", type: "radio", required: true, options: ["Exceeded", "Met", "Below expectations"] },
    ],
  },
  {
    id: "speakers",
    title: "Speakers & Facilitators",
    fields: [
      { id: "speaker_rating", label: "Quality of speakers and facilitators", type: "rating", required: true, scale: 5 },
      { id: "speaker_comments", label: "Comments on the speakers", type: "textarea" },
    ],
  },
  {
    id: "venue",
    title: "Venue & Logistics",
    fields: [
      { id: "venue_rating", label: "Venue, comfort, and logistics", type: "rating", required: true, scale: 5 },
      { id: "venue_comments", label: "Any venue or logistics feedback?", type: "textarea" },
    ],
  },
  {
    id: "content",
    title: "Content Relevance",
    fields: [
      { id: "content_rating", label: "How relevant was the content to you?", type: "rating", required: true, scale: 5 },
    ],
  },
  {
    id: "organization",
    title: "Organization & Coordination",
    fields: [
      { id: "organization_rating", label: "Overall organization and coordination", type: "rating", required: true, scale: 5 },
    ],
  },
  {
    id: "highlights",
    title: "Highlights & Improvements",
    fields: [
      { id: "most_valuable", label: "Most valuable session for you", type: "text" },
      { id: "improvements", label: "Areas for improvement", type: "textarea" },
      { id: "suggestions", label: "Suggestions and recommendations", type: "textarea" },
      { id: "additional", label: "Additional comments", type: "textarea" },
    ],
  },
];
