import { memo, useCallback, useEffect, useMemo, useState } from "react";
import User from "./User";
import { request } from "./utilities/request";

type Props = {};

export interface UserInfo {
  departmentName: string;
  endepartmentName: string;
  avatatype: string;
  name: string;
  empNo: string;
  id: string;
  username: string;
  realname: string;
  aliasname?: string;
}

const Layout = (props: Props) => {
  const {} = props;

  const [useInfo, setUserInfo] = useState<UserInfo>();

  useEffect(() => {
    request.get("userinfo/userObj").then((res) => {
      if ("data" in res && res.data.data) {
        setUserInfo(res.data.data);
      }
    });
  }, []);

  return (
    <div>
      <User userInfo={useInfo}></User>
    </div>
  );
};

export default memo(Layout);
