import { View, type ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/** Stroke icons used in the screen designs (24×24 grid). */
const ICONS = {
  home: <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  book: (
    <>
      <Path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2.5z" />
      <Path d="M8 7h8" />
    </>
  ),
  target: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Circle cx={12} cy={12} r={5} />
      <Circle cx={12} cy={12} r={1} />
    </>
  ),
  user: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  speaker: (
    <>
      <Path d="M11 5 6 9H3v6h3l5 4z" />
      <Path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <Path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  star: <Path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />,
  flame: (
    <Path d="M12 22c4 0 7-2.8 7-7 0-4-3-6.5-4.5-9.5-.8 2.2-2 3.3-3.5 3.8C11 6 10 4 8.5 2 8.8 6 5 8.5 5 14c0 4.5 3 8 7 8z" />
  ),
  more: (
    <>
      <Circle cx={5} cy={12} r={1} />
      <Circle cx={12} cy={12} r={1} />
      <Circle cx={19} cy={12} r={1} />
    </>
  ),
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="m20 20-3.5-3.5" />
    </>
  ),
  back: <Path d="M15 18 9 12l6-6" />,
  check: <Path d="m5 12 5 5 9-10" />,
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  chevron: <Path d="m9 6 6 6-6 6" />,
  clock: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  bell: (
    <>
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <Path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  settings: (
    <>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  cloud: <Path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19 10a4 4 0 0 1 0 8z" />,
  device: (
    <>
      <Path d="M12 4v11" />
      <Path d="m7 10 5 5 5-5" />
      <Path d="M5 20h14" />
    </>
  ),
  trend: (
    <>
      <Path d="M4 17 10 11l4 4 6-8" />
      <Path d="M15 7h5v5" />
    </>
  ),
  minus: <Path d="M5 12h14" />,
  plus: <Path d="M12 5v14M5 12h14" />,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  color,
  size = 22,
  strokeWidth = 2,
  filled = false,
}: {
  name: IconName;
  color: ColorValue;
  size?: number;
  strokeWidth?: number;
  /** Fills the shape with the stroke colour (used for the saved star). */
  filled?: boolean;
}) {
  // Icons are decorative: the wrapper hides them from screen readers on every platform.
  return (
    <View
      style={{ pointerEvents: 'none' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round">
        {ICONS[name]}
      </Svg>
    </View>
  );
}
