import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 60 * 1000, // 60s — show cached data instantly, refetch in background
			placeholderData: (prev) => prev, // keep previous data while loading new page
		},
		mutations: {
			// Never block the UI on mutations — all mutations should use optimistic updates
			// at the call site. This default ensures no global retry loops on failures.
			retry: 0,
		},
	},
});