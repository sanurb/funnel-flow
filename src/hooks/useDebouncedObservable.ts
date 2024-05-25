import { useEffect, useRef } from "react";
import { debounceTime, filter, fromEvent, throttleTime } from "rxjs";

export const useDebouncedObservable = <T extends React.DragEvent>(
	eventName: string,
	handler: (e: T) => void,
	debounce: number,
) => {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		const event$ = fromEvent<T>(element, eventName).pipe(
			throttleTime(50),
			debounceTime(debounce),
			// Filter out events that are not directly on the element
			filter((e) => e.target === element),
		);

		const subscription = event$.subscribe(handler);

		return () => subscription.unsubscribe();
	}, [eventName, handler, debounce]);

	return ref;
};
