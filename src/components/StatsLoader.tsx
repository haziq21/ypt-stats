export default (props: { name: string }) => (
  <>
    <h1 hx-post="/stats" hx-trigger="load" hx-target="#stats">
      hi {props.name}
    </h1>
    <p>im loading your stats (alr deleted the grp)</p>
    <div id="stats"></div>
  </>
);
