export const issueParmas = {
  pagesize: 30,
  pageid: 1,
  orderby: "-issueKey",
  filterParamsList: [
    {
      fields: [{ fieldId: -10089, frontendName: "relatedObj" }],
      operator: "in",
      frontendName: "relatedObj",
      vobjlist: [],
    },
    {
      fields: [{ fieldId: -10088, frontendName: "issueStatusCategory" }],
      operator: "in",
      frontendName: "issueStatusCategory",
      vobjlist: [
        { id: 1, desc: "To Do" },
        { id: 2, desc: "In Progress" },
      ],
    },
  ],
  keyword: "",
  expandAll: false,
};
