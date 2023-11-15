import { tw } from "npm:twind";

export default (props: { style: string }) => (
  <html>
    <head>
      <title>YPT stats generator</title>
      <script src="https://unpkg.com/htmx.org@1.9.6"></script>
    </head>
    <body class={tw`bg-warmGray-900 text-warmGray-400`}>
      {/* Injected CSS goes in the <div> */}
      <div dangerouslySetInnerHTML={{ __html: props.style }} />

      <nav class={tw`py-5 px-8 text-xl font-bold flex-none`}>
        <span class={tw`text-warmGray-50`}>YPT&nbsp;</span>
        <span class={tw`text-emerald-400`}>Stats</span>
      </nav>

      <main
        hx-target="this"
        class={tw`max-w-max mx-auto px-8 flex(& col) items-center`}
      >
        <p class={tw`pt(16 md:32) mb-8`}>
          Generate activity statistics for

          <span class={tw`text-warmGray-50 font-medium inline-block`}>
            <img
              src="/assets/ypt-icon.png"
              alt=""
              class={tw`inline-block w-4 -mt-1 ml-2 mr-1`}
            />
            YPT
          </span>, the group study app.
        </p>
        <button
          hx-post="/otg"
          class={tw`bg-emerald-600 border(2 emerald-500)
          text(lg warmGray-50) font-semibold
          px-6 py-2 rounded-lg flex items-center group`}
        >
          Get started
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            class={tw`w-6 h-6 ml-2 transform group-hover:translate-x-3 inline-block transition`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
            />
          </svg>
        </button>
      </main>
    </body>
  </html>
);
