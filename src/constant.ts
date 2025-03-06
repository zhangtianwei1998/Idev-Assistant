export const issueParmas = {
  filterId: -2001,
  pagesize: 10,
  pageid: 1,
  orderby: "-issueKey",
};

const isProd = false;

export const basicUrl = isProd
  ? "https://idev2.ctripcorp.com/api"
  : "https://idev2-00.fat6.qa.nt.ctripcorp.com/api/";

export const loginUrl = isProd
  ? "https://idev2.ctripcorp.com"
  : "http://sharklocal.ctripcorp.com:5173/vscodeExtension";
