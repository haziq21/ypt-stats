import { tw } from "npm:twind";
import { qrcode } from "https://deno.land/x/qrcode@v2.0.0/mod.ts";

export default async (props: {
  otg: string;
  name: string;
  password: string;
  link: string;
}) => (
  <>
    <p class={tw`pt(8 sm:16 md:32) mb-12 max-w-prose`}>
      Join this temporary
      <span class={tw`mr-2`} />
      <span class={tw`text-warmGray-200 font-medium inline-block`}>
        <img
          src="/assets/ypt-icon.png"
          alt=""
          class={tw`inline-block w-4 -mt-1 mr-1`}
        />
        YPT
      </span>
      <span class={tw`mr-1`} />
      group so we can gather your study data.
    </p>
    <div
      class={tw`flex(& col sm:row) gap(12 sm:0) items-center justify-between w-full max-w-[40rem]`}
      hx-post={`/stats-card?otg=${props.otg}`}
      hx-trigger="load"
    >
      <img
        src={await qrcode(props.link, { size: 200 })}
        alt="QR code of the invite link"
        class={tw`border(4 white)`}
      />

      <dl class={tw`grid content-between`}>
        <dt class={tw`text(warmGray-500 sm)`}>Name</dt>
        <dd class={tw`text(warmGray-100 xl) row-start-2`}>{props.name}</dd>
        <dt class={tw`text(warmGray-500 sm)`}>Password</dt>
        <dd class={tw`text(warmGray-100 xl)`}>{props.password}</dd>
        <dt class={tw`col-span-2 mt-8 text(warmGray-500 sm)`}>Invite link</dt>
        <dd
          class={tw`col-span-2 text(warmGray-400 hover:warmGray-200 active:warmGray-200 sm sm:lg)
          mt-1 block group`}
        >
          <a
            href={props.link}
            target="_blank"
            class={tw`bg(warmGray-800 hover:warmGray-700) rounded-md px-4 py-2 inline-block focus-ring`}
          >
            {props.link}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width={2}
              stroke="currentColor"
              class={tw`w-4 h-4 sm:(w-5 h-5) ml-3 -mt-1.5 inline-block text(warmGray-400 group-hover:warmGray-300)`}
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        </dd>
      </dl>
    </div>
  </>
);
