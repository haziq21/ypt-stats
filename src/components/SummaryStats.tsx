import { Stats } from "../ypt.ts";

export default (props: Stats) => (
  <>
    <p>
      {Math.round(props.totalStudyTime / 1000 / 60 / 60)}h total study time!!!
    </p>
    <p>i havent formatted these: {JSON.stringify(props)}</p>
  </>
);
