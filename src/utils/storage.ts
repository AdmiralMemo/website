import React from 'react';
import * as localForage from 'localforage';
import * as lz from 'lz-string';

const COMPRESSION_SUFFIX = "___Lz";

const windowGlobal = typeof window !== 'undefined' && window;

interface StorageOptions {
	rememberForever?: boolean;	// We always store in session; we can also store in local storage if told to remember forever
	useDefault?: boolean;	// Set to true to use default value as initial value instead of any stored value
	useAndStoreDefault?: boolean;	// Set to true to use default and store it immediately to avoid render loops
	onInitialize?: (itemKey: string, itemValue: any) => void;	// Callback after value is initialized
	compress?: boolean;
};

const StorageDefaultOptions: StorageOptions = {
	rememberForever: false,
	useDefault: false,
	useAndStoreDefault: false,
	onInitialize: undefined,
	compress: false
};

/**
 * Create a React state based on localStorage or sessionStorage
 * @param itemKey The item's storage key
 * @param itemDefault The item's default value
 * @param options StorageOptions
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>]} stateful value and setter method
 */
export function useStateWithStorage<T>(itemKey: string, itemDefault: T, options?: StorageOptions): [T, React.Dispatch<React.SetStateAction<T>>] {
	if (!options) options = StorageDefaultOptions;

	// Set initial value in state
	let updateWithLocalValue = false;
	const [value, setValue] = React.useState<T>(() => {
		// Use default value if requested
		if (options?.useAndStoreDefault) {
			storeItem(itemKey, itemDefault, options?.rememberForever ?? false, options?.compress);
			return itemDefault;
		}
		if (options?.useDefault) return itemDefault;
		if (options?.rememberForever) {
			// Always use session value if set, even if set to remember forever
			let sessionValue = getStoredItem(itemKey, undefined);
			if (sessionValue != undefined) {
				return sessionValue;
			}
			// Otherwise use default value with the intent to update from local storage when ready
			else {
				updateWithLocalValue = true;
				return itemDefault;
			}
		}
		return getStoredItem(itemKey, itemDefault);
	});

	// On component mount, update from local storage if necessary,
	//	then send message that value is done initializing and what the initial value will be
	React.useEffect(() => {
		if (updateWithLocalValue)  {
			getStoredItemPromise(itemKey, itemDefault).then((storedValue) => {
				setValue(storedValue as T);
				if (options?.onInitialize) options.onInitialize(itemKey, storedValue);
			});
		}
		else if (options?.onInitialize) {
			options?.onInitialize(itemKey, value);
		}
	}, []);

	// Update stored value when value changed in state
	React.useEffect(() => {
		// Remove from store (or ignore) if new value is undefined or default
		if (value === undefined || value == itemDefault) {
			removeStoredItem(itemKey);
		}
		else {
			storeItem(itemKey, value, options?.rememberForever ?? false, options?.compress);
		}
	}, [value]);

	return [value, setValue];
};

// Use JSON.stringify and JSON.parse to preserve item types when storing, getting
const storeItem = (itemKey: string, itemValue: any, useLocalStorage: boolean, compress?: boolean) => {
	if (windowGlobal && windowGlobal.sessionStorage) {
		if (compress) {
			windowGlobal.sessionStorage.setItem(itemKey + COMPRESSION_SUFFIX, lz.compressToBase64(JSON.stringify(itemValue)));
		}
		else {
			windowGlobal.sessionStorage.setItem(itemKey, JSON.stringify(itemValue));
		}		
	}
		
	if (useLocalStorage) {
		if (compress) {
			localForage.setItem(itemKey + COMPRESSION_SUFFIX, lz.compressToBase64(JSON.stringify(itemValue)));
		}
		else {
			localForage.setItem(itemKey, JSON.stringify(itemValue));
		}
	}
	// Remove locally stored item if local storage no longer needed, but item currently saved there
	else {
		localForage.removeItem(itemKey);
		localForage.removeItem(itemKey + COMPRESSION_SUFFIX);
	}
};
export const getStoredItem = (itemKey: string, itemDefault: any) => {
	if (!(windowGlobal && windowGlobal.sessionStorage)) return itemDefault;

	let sessionValue = windowGlobal.sessionStorage.getItem(itemKey);

	if (!sessionValue) {
		sessionValue = windowGlobal.sessionStorage.getItem(itemKey + COMPRESSION_SUFFIX);
		if (sessionValue) {
			sessionValue = lz.decompressFromBase64(sessionValue);
		}
	}

	if (sessionValue) {
		return JSON.parse(sessionValue);
	}

	return itemDefault;
};

const getStoredItemPromise = (itemKey: string, itemDefault: any) => {
	return new Promise(async (resolve, reject) => {
		let localValue = await localForage.getItem<string>(itemKey);

		if (!localValue) {
			localValue = await localForage.getItem<string>(itemKey + COMPRESSION_SUFFIX);
			if (localValue) {
				localValue = lz.decompressFromBase64(localValue);
			}
			else {
				resolve(itemDefault);
			}			
		}

		resolve(JSON.parse(localValue as string));
	});
};
const removeStoredItem = (itemKey: string) => {
	if (windowGlobal && windowGlobal.sessionStorage)
		windowGlobal.sessionStorage.removeItem(itemKey);
	localForage.removeItem(itemKey);
	localForage.removeItem(itemKey + COMPRESSION_SUFFIX);
};
