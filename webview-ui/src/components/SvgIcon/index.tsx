import React, { memo } from "react";
import "./index.css";

import { useDynamicSvgImport } from "./useDynamicSvgImport";

export interface IProps {
  iconName: string;
  wrapperStyle?: string;
  svgProp?: React.SVGProps<SVGSVGElement>;
}

function SvgIcon(props: IProps) {
  const { iconName, wrapperStyle, svgProp } = props;
  const { loading, SvgIcon } = useDynamicSvgImport(iconName);

  return (
    <>
      {loading && <div className={"loading"}></div>}
      {SvgIcon && (
        <div className={wrapperStyle || " " + "iconBox"}>
          <SvgIcon {...{ width: "1em", height: "1em", fill: "currentColor", ...svgProp }} />
        </div>
      )}
    </>
  );
}

export default memo(SvgIcon);
