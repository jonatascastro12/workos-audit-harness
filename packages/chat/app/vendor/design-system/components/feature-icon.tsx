import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";

type Feature = keyof typeof images;

interface FeatureIconOwnProps {
  size?: "1" | "2" | "3";
  feature: Feature;
}

export interface FeatureIconProps
  extends Omit<React.ComponentPropsWithRef<"div">, "children">, MarginProps, FeatureIconOwnProps {}

const images = {
  "admin-portal": "https://images.workoscdn.com/docs/icons/admin-portal-20220915.png",
  "audit-logs": "https://images.workoscdn.com/docs/icons/audit-logs-20220915.png",
  "authkit-ui": "https://images.workoscdn.com/images/cd618d41-9d9d-4108-a8b3-2548bef48565.png",
  "auth0-credentials":
    "https://images.workoscdn.com/images/5aba88d9-e120-44ac-a53e-a7446a362b6e.png",
  "domain-verification":
    "https://images.workoscdn.com/images/e7d34bcd-09a5-457c-b894-c77e7164b4d2.png",
  "directory-sync": "https://images.workoscdn.com/docs/icons/directory-sync-20220915.png",
  "magic-link": "https://images.workoscdn.com/docs/icons/magic-link-20220915.png",
  mfa: "https://images.workoscdn.com/docs/icons/mfa-20220915.png",
  pipes: "https://images.workoscdn.com/images/ecec2848-7878-4d16-bd3b-e8f8fb2e87b6.png",
  sso: "https://images.workoscdn.com/docs/icons/sso-20220915.png",
  "user-management": "https://images.workoscdn.com/images/3e4702e1-3e6b-417e-a319-ea07cff89e61.png",
  emails: "https://images.workoscdn.com/images/0cda7263-3616-46af-8a22-2482a6bcedab.png",
  passkeys: "https://images.workoscdn.com/images/24729fe5-1959-4a1c-a344-60f4a201d3b6.png",
  sessions: "https://images.workoscdn.com/images/39bbd891-150e-4c29-8b4c-e819a807de53.png",
  impersonation: "https://images.workoscdn.com/images/65b2a5cb-30fd-47ee-b2a4-c5ac13535798.png",
  fga: "https://images.workoscdn.com/images/b2dfe55a-71c0-4cde-822b-008661184d83.png",
  "stripe-entitlements":
    "https://images.workoscdn.com/images/059012c7-3929-4f1a-a69a-c5325cce856a.png",
  cors: "https://images.workoscdn.com/images/3c3d21a3-157e-41b3-9242-d1b7df723eed.png",
  "jwt-template": "https://images.workoscdn.com/images/20ce8678-8b79-46c7-8f92-0d41e83aaf18.png",
  vault: "https://images.workoscdn.com/images/0a039188-a43b-4977-ac70-5297c59aef88.png",
  rbac: "https://images.workoscdn.com/images/a98eae2c-11de-4f68-870d-e59d8c43b0ae.png",
  "feature-flags": "https://images.workoscdn.com/images/21e06a1f-2a0e-4421-acda-2505254088fb.png",
  widgets: "https://images.workoscdn.com/images/97226f05-2516-40c5-a583-f67bc2192227.png",
};

const FeatureIcon = React.forwardRef<HTMLDivElement, FeatureIconProps>((props, forwardedRef) => {
  const {
    className,
    feature,
    size = "2",
    ...featureIconProps
  } = extractProps(props, marginPropDefs);
  return (
    <div
      ref={forwardedRef}
      className={classNames(className, "FeatureIcon", {
        "size-1": size === "1",
        "size-2": size === "2",
        "size-3": size === "3",
      })}
      {...featureIconProps}
    >
      <img className="FeatureIconImage" role="presentation" src={images[feature]} />
    </div>
  );
});

FeatureIcon.displayName = "FeatureIcon";

export { FeatureIcon };
