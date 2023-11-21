import { tw } from "npm:twind";
import { Stats } from "../ypt.ts";

export default (props: Stats) => (
  <>
    <p id="record-streak" hx-swap-oob class={tw`text-sm`}>
      {props.longestStreak} day record streak
    </p>
    <p class={tw`px-8 mb-8`}>
      {Math.round(props.totalStudyTime / 1000 / 60 / 60)}h total study time!!!
    </p>
    {/* <p>i havent formatted these: {JSON.stringify(props)}</p> */}
  </>
);
