import classNames from "classnames";
import * as React from "react";
import { extractProps } from "../helpers/themes.js";
import { marginPropDefs, MarginProps } from "../props.js";

interface LogoIconOwnProps {
  size?: "1" | "2" | "3";
}

interface LogoIconProps
  extends Omit<React.ComponentPropsWithRef<"div">, "children">, MarginProps, LogoIconOwnProps {}

const LogoIcon = React.forwardRef<HTMLDivElement, LogoIconProps>((props, forwardedRef) => {
  const { className, size = "2", ...logoIconProps } = extractProps(props, marginPropDefs);
  // We need unique ids for the SVG effects to avoid subtle style bugs
  // in Safari when these icons are rendered in components that may unmount.
  const iconId = React.useId();
  return (
    <div
      ref={forwardedRef}
      className={classNames(className, "LogoIcon", {
        "size-1": size === "1",
        "size-2": size === "2",
        "size-3": size === "3",
      })}
      {...logoIconProps}
    >
      <svg
        className="LogoIconSvg"
        fill="none"
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.25 32.0625C8.25 23.7273 8.25 19.5598 9.87213 16.3762C11.299 13.5758 13.5758 11.299 16.3762 9.87213C19.5598 8.25 23.7273 8.25 32.0625 8.25H47.9375C56.2727 8.25 60.4402 8.25 63.6238 9.87213C66.4242 11.299 68.701 13.5758 70.1279 16.3762C71.75 19.5598 71.75 23.7273 71.75 32.0625V47.9375C71.75 56.2727 71.75 60.4402 70.1279 63.6238C68.701 66.4242 66.4242 68.701 63.6238 70.1279C60.4402 71.75 56.2727 71.75 47.9375 71.75H32.0625C23.7273 71.75 19.5598 71.75 16.3762 70.1279C13.5758 68.701 11.299 66.4242 9.87213 63.6238C8.25 60.4402 8.25 56.2727 8.25 47.9375V32.0625Z"
          fill="var(--purple-9)"
          filter={`url(#${iconId}-filter-1)`}
        />
        <path
          d="M8 32C8 23.5992 8 19.3988 9.6349 16.1901C11.073 13.3677 13.3677 11.073 16.1901 9.6349C19.3988 8 23.5992 8 32 8H48C56.4008 8 60.6012 8 63.8099 9.6349C66.6323 11.073 68.927 13.3677 70.3651 16.1901C72 19.3988 72 23.5992 72 32V48C72 56.4008 72 60.6012 70.3651 63.8099C68.927 66.6323 66.6323 68.927 63.8099 70.3651C60.6012 72 56.4008 72 48 72H32C23.5992 72 19.3988 72 16.1901 70.3651C13.3677 68.927 11.073 66.6323 9.6349 63.8099C8 60.6012 8 56.4008 8 48V32Z"
          fill="var(--purple-9)"
        />
        <g filter={`url(#${iconId}-filter-2)`}>
          <path
            d="M18.4 40C18.4 40.8208 18.616 41.6416 19.0336 42.3472L26.608 55.4656C27.3856 56.8048 28.5664 57.8992 30.0352 58.3888C32.9296 59.3536 35.9248 58.1152 37.3504 55.6384L39.1792 52.4704L31.9648 40L39.5824 26.7952L41.4112 23.6272C41.9584 22.6768 42.6928 21.8992 43.5568 21.28H42.7648H31.8064C29.7472 21.28 27.8464 22.3744 26.824 24.16L19.0336 37.6528C18.616 38.3584 18.4 39.1792 18.4 40Z"
            fill={`url(#${iconId}-gradient-1)`}
          />
          <path
            d="M61.6001 39.9999C61.6001 39.1791 61.3841 38.3583 60.9665 37.6527L53.2912 24.3615C51.8656 21.8991 48.8704 20.6607 45.976 21.6111C44.5072 22.1007 43.3264 23.1951 42.5488 24.5343L40.8208 27.5151L48.0352 39.9999L40.4176 53.2047L38.5888 56.3727C38.0416 57.3087 37.3072 58.1007 36.4432 58.7199H37.2352H48.1936C50.2528 58.7199 52.1536 57.6255 53.176 55.8399L60.9665 42.3471C61.3841 41.6415 61.6001 40.8207 61.6001 39.9999Z"
            fill={`url(#${iconId}-gradient-2)`}
          />
        </g>
        <defs>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="69"
            id={`${iconId}-filter-1`}
            width="67.5"
            x="6.25"
            y="6.75"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feMorphology
              in="SourceAlpha"
              operator="erode"
              radius="1"
              result={`${iconId}-effect-1`}
            />
            <feOffset dy="2" />
            <feGaussianBlur stdDeviation="1.5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
            <feBlend in2="BackgroundImageFix" mode="normal" result={`${iconId}-effect-1`} />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="0.5" />
            <feGaussianBlur stdDeviation="1" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
            <feBlend in2={`${iconId}-effect-1`} mode="normal" result={`${iconId}-effect-2`} />
            <feBlend in="SourceGraphic" in2={`${iconId}-effect-2`} mode="normal" result="shape" />
          </filter>
          <filter
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
            height="61.94"
            id={`${iconId}-filter-2`}
            width="67.2"
            x="6.4"
            y="21.28"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="1.5" />
            <feGaussianBlur stdDeviation="0.5" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0117647 0 0 0 0 0.00784314 0 0 0 0 0.0509804 0 0 0 0.04 0"
            />
            <feBlend in2="BackgroundImageFix" mode="normal" result={`${iconId}-effect-1`} />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="2" />
            <feGaussianBlur stdDeviation="0.75" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0117647 0 0 0 0 0.00784314 0 0 0 0 0.0509804 0 0 0 0.06 0"
            />
            <feBlend in2={`${iconId}-effect-1`} mode="normal" result={`${iconId}-effect-2`} />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="3" />
            <feGaussianBlur stdDeviation="1.25" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0117647 0 0 0 0 0.00784314 0 0 0 0 0.0509804 0 0 0 0.06 0"
            />
            <feBlend in2={`${iconId}-effect-2`} mode="normal" result={`${iconId}-effect-3`} />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="5.5" />
            <feGaussianBlur stdDeviation="2.5" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0117647 0 0 0 0 0.00784314 0 0 0 0 0.0509804 0 0 0 0.08 0"
            />
            <feBlend in2={`${iconId}-effect-3`} mode="normal" result={`${iconId}-effect-4`} />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy="12.5" />
            <feGaussianBlur stdDeviation="6" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0117647 0 0 0 0 0.00784314 0 0 0 0 0.0509804 0 0 0 0.1 0"
            />
            <feBlend in2={`${iconId}-effect-4`} mode="normal" result={`${iconId}-effect-5`} />
            <feBlend in="SourceGraphic" in2={`${iconId}-effect-5`} mode="normal" result="shape" />
          </filter>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={`${iconId}-gradient-1`}
            x1="31"
            x2="31"
            y1="21.3"
            y2="58.7"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="#BDBFFF" />
          </linearGradient>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={`${iconId}-gradient-2`}
            x1="49"
            x2="49"
            y1="21.3"
            y2="58.7"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="#BDBFFF" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});

LogoIcon.displayName = "LogoIcon";

export { LogoIcon };
