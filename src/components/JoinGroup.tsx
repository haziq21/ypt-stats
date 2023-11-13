export default (props: {
  name: string;
  password: string;
  link: string;
}) => (
  <>
    <p hx-get="/stats-loader" hx-trigger="load">
      join this group rn <a href={props.link}>{props.name}</a>
    </p>
    (password is {props.password})
  </>
);
