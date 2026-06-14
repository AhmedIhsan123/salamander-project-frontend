import { createContext, useContext, useState, useCallback } from "react";

// Simple toast notifications. Wrap the app in <ToastProvider> and call
// useToast() anywhere to show a quick message.
const ToastContext = createContext(() => {});

export function useToast() {
	return useContext(ToastContext);
}

export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);

	const showToast = useCallback((message, type = "info") => {
		const id = Date.now() + Math.random();
		setToasts((list) => [...list, { id, message, type }]);
		// auto-remove after 3.5s
		setTimeout(() => {
			setToasts((list) => list.filter((t) => t.id !== id));
		}, 3500);
	}, []);

	return (
		<ToastContext.Provider value={showToast}>
			{children}
			<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
				{toasts.map((t) => (
					<div
						key={t.id}
						className={
							"animate-in slide-in-from-right-4 rounded-sm px-4 py-2.5 text-sm shadow-md " +
							(t.type === "error"
								? "bg-red-600 text-white"
								: t.type === "success"
									? "bg-green-700 text-white"
									: "bg-stone-800 text-white")
						}
					>
						{t.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}
