import "./styles/global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/preact-query";
import { render } from "preact";

import { App } from "./app/App";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { refetchOnWindowFocus: false, retry: false },
        mutations: { retry: false },
    },
});

const root = document.getElementById("app");
if (root) {
    render(
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>,
        root,
    );
}
