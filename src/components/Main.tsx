import { tw } from "npm:twind";

export default (props: { style: string }) => (
  <html>
    <head>
      <title>YPT stats generator</title>
      <script src="https://unpkg.com/htmx.org@1.9.6"></script>
    </head>
    <body class={tw`bg-warmGray-900 text-warmGray-300`}>
      <div dangerouslySetInnerHTML={{ __html: props.style }} />
      <main hx-target="this">
        <p>hi this is the ypt stats generator!!</p>
        <button hx-post="/otg">lets GOo</button>
      </main>
    </body>
  </html>
);
