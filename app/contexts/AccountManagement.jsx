import {
	createContext,
	useEffect,
	useMemo,
	useState
} from "react";

export const AccountContext = createContext();

export function AccountProvider({
	children
}) {
	const [isAuthenticated, setIsAuthenticated] = useState(null);
	const [userData, setUserData] = useState({  });

	/*
		TODO: Multiple OAuth methods. I would use the custom authentication flow I made for other projects (that didn't need to rely on any
		TODO:	external OAuth), but I think I should start fresh with Smithy.
	*/
	const loadData = async () => {
		let authenticated;

		const checkResult = await fetch('/api/oauth/check');
		if (checkResult.status === 200) authenticated = true;
		else authenticated = false;

		if (!authenticated) {
			setIsAuthenticated(false);
			return;
		} else {
			const refreshResult = await fetch('/api/oauth/refresh');

			setIsAuthenticated(refreshResult.ok);
			if (refreshResult.ok) {
				const responseData = await refreshResult.json();
				console.log(responseData);
				setUserData(responseData);
			}
		}
	}

	useEffect(() => {
		(async () => loadData())();
	}, [])

	return (
		<AccountContext.Provider value={{
			isAuthenticated,
			userData
		}}>
			{children}
		</AccountContext.Provider>
	);
}