import { tw } from "npm:twind";

export default (props: { style: string; children }) => (
  <html>
    <head>
      <title>YPT summary statistics</title>
      <meta name="viewport" content="width=device-width" />
      <script src="https://unpkg.com/htmx.org@1.9.6"></script>
    </head>
    <body class={tw`bg-warmGray-900 text-warmGray-400`}>
      {/* Injected CSS goes in the <div> */}
      <div dangerouslySetInnerHTML={{ __html: props.style }} />

      <nav class={tw`py-5 px-8 text-xl font-bold`}>
        <h1>
          <span class={tw`text-warmGray-50`}>YPT&nbsp;</span>
          <span class={tw`text-emerald-400`}>Stats</span>
        </h1>
      </nav>

      <main
        hx-target="this"
        class={tw`mx-auto px-8 flex(& col) items-center`}
      >
        {props.children}
      </main>
    </body>
  </html>
);
