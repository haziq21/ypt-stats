import { tw } from "npm:twind";

export default (props: { name: string }) => (
  <>
    <figure
      class={tw`border(2 warmGray-700) rounded-lg pt-6 pb-3 w-full max-w-xl`}
    >
      <div class={tw`flex justify-between items-center mb-8 px-8`}>
        <div>
          <h2 class={tw`font-semibold text(4xl warmGray-50) mb-1`}>
            {props.name}
          </h2>
          <p>
            on<span class={tw`mr-2`} />
            <span class={tw`text-warmGray-200 font-medium inline-block`}>
              <img
                src="/assets/ypt-icon.png"
                alt=""
                class={tw`inline-block w-4 -mt-1 mr-1`}
              />
              YPT
            </span>
          </p>
        </div>

        <div class={tw`text-right`}>
          <p
            class={tw`uppercase tracking-wider font-bold text(xl warmGray-600)`}
          >
            Past month
          </p>
          <p id="record-streak"></p>
        </div>
      </div>

      <div hx-post="/stats" hx-trigger="load" hx-target="this"></div>

      <p class={tw`text(xs warmGray-600) pl-4`}>
        Generated at https://ypt-stats.deno.dev
      </p>
    </figure>
  </>
);
