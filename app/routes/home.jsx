import { env } from "cloudflare:workers";

import { Welcome } from "../welcome/welcome";

/**
 * 
 * @param {import("react-router").MetaArgs} param0 
 */
export function meta({}) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader() {
  return { message: env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }) {
  return <Welcome message={loaderData.message} />;
}
