import { memo } from "react";
import { UserInfo } from "./Layout";

const User = ({ userInfo }: { userInfo?: UserInfo }) => {
  return <div className="userAvatar">{userInfo?.aliasname}</div>;
};

export default memo(User);
