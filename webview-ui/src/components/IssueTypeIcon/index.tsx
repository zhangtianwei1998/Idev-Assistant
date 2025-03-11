import SvgIcon from "../SvgIcon";

const IssueTypeIcon = ({
  iconId,
  ...rest
}: {
  iconId?: string | null | number;
  [prop: string]: any;
}) => {
  const id = iconId ? iconId + "" : 0;
  const iconIdMeta = id ? (Number(id) < 10 ? 0 + id : id) : 0;

  return <SvgIcon iconName={`issueType/${iconIdMeta}`} {...rest} />;
};

export default IssueTypeIcon;
