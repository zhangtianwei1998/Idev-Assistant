export const issueParmas = {
  filterId: -2001,
  pagesize: 30,
  pageid: 1,
  orderby: "-issueKey",
};

export const isTestMode = false;

export const exactThreshold = isTestMode ? 3 * 1000 : 1 * 60 * 1000;
export const fuzzyThreshold = isTestMode ? 6 * 1000 : 10 * 60 * 1000;

export const intervalTime = isTestMode ? 1000 : 5000;

const isProd = true;

export const basicUrl = isProd
  ? "https://idev2.ctripcorp.com/api"
  : "https://idev2-11.fat6.qa.nt.ctripcorp.com/api/";

export const loginUrl = isProd
  ? "https://idev2.ctripcorp.com/vscodeExtension"
  : "http://sharklocal.ctripcorp.com:5173/vscodeExtension";

export const getIssueUrl = (issueKey: string) => {
  return isProd
    ? `https://idev2.ctripcorp.com/issueDetail/${issueKey}`
    : `https://idev2-11.fat6.qa.nt.ctripcorp.com/issueDetail/${issueKey}`;
};
