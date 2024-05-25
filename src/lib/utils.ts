import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function withRetry<T>(
	fn: () => Promise<T>,
	retries = 3,
	delay = 1000,
): Promise<T> {
	try {
		return await fn();
	} catch (error: any) {
		if (retries > 0 && error.message === "Too Many Requests") {
			console.log(`Retrying... Attempts left: ${retries}`);
			await new Promise((resolve) => setTimeout(resolve, delay));
			return withRetry(fn, retries - 1, delay);
		}
		throw error;
	}
}

export const formatDate = (date: Date): string => {
	return `${date.toDateString()} ${date.toLocaleTimeString()}`;
};

export function getStripeOAuthLink(
	accountType: 'agency' | 'subaccount',
	state: string
) {
	return `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_STRIPE_CLIENT_ID}&scope=read_write&redirect_uri=${process.env.NEXT_PUBLIC_URL}${accountType}&state=${state}`
}
