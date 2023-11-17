import { tw } from "npm:twind";

export default () => (
  <>
    <p class={tw`pt(8 sm:16 md:32) mb-8`}>
      Generate activity statistics for
      <span class={tw`mr-2`} />
      <span class={tw`text-warmGray-200 font-medium inline-block`}>
        <img
          src="/assets/ypt-icon.png"
          alt=""
          class={tw`inline-block w-4 -mt-1 mr-1`}
        />
        YPT
      </span>, the group study app.
    </p>
    <button
      hx-get="/otg"
      class={tw`bg(emerald-600 active:emerald-700) border(2 emerald-500)
text(lg warmGray-50) font-semibold
px-6 py-2 rounded-lg flex items-center group`}
    >
      Get started
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width={2}
        stroke="currentColor"
        class={tw`w-6 h-6 ml-2 transform group-hover:translate-x-3 inline-block transition`}
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
        />
      </svg>
    </button>
  </>
);
