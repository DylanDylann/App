import React from 'react';
import {TextInput} from 'react-native';

const searchInputRef = React.createRef<TextInput>();
let onSearchInputChange: (text: string) => void = () => {};
let searchInput: string = '';
export default {
    searchInputRef,
    onSearchInputChange,
    searchInput,
};
