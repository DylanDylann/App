/* eslint-disable @typescript-eslint/naming-convention */
import * as GooglePlacesUtils from '@src/libs/GooglePlacesUtils';
import type {AddressComponent, AddressTerm, FieldsToExtract} from '@src/libs/GooglePlacesUtils';

const standardObjectToFind: FieldsToExtract = {
    sublocality: 'long_name',
    administrative_area_level_1: 'short_name',
    postal_code: 'long_name',
    'does-not-exist': 'long_name',
};

const objectWithCountryToFind: FieldsToExtract = {
    sublocality: 'long_name',
    administrative_area_level_1: 'short_name',
    postal_code: 'long_name',
    'does-not-exist': 'long_name',
    country: 'long_name',
};

const addressComponents: AddressComponent[] = [
    {
        long_name: 'Bushwick',
        short_name: 'Bushwick',
        types: ['neighborhood', 'political'],
    },
    {
        long_name: 'Brooklyn',
        short_name: 'Brooklyn',
        types: ['sublocality_level_1', 'sublocality', 'political'],
    },
    {
        long_name: 'New York',
        short_name: 'NY',
        types: ['administrative_area_level_1', 'political'],
    },
    {
        long_name: 'United States',
        short_name: 'US',
        types: ['country', 'political'],
    },
    {
        long_name: '11206',
        short_name: '11206',
        types: ['postal_code'],
    },
];

const autoCompleteTerms: AddressTerm[] = [{value: 'Bangladesh Border Road'}, {value: 'Bangladesh'}];

describe('GooglePlacesUtilsTest', () => {
    describe('getAddressComponents', () => {
        it('should find address components by type', () => {
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, {sublocality: 'long_name'})).toStrictEqual({sublocality: 'Brooklyn'});
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, {administrative_area_level_1: 'short_name'})).toStrictEqual({administrative_area_level_1: 'NY'});
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, {postal_code: 'long_name'})).toStrictEqual({postal_code: '11206'});
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, {'does-not-exist': 'long_name'})).toStrictEqual({'does-not-exist': ''});
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, standardObjectToFind)).toStrictEqual({
                sublocality: 'Brooklyn',
                administrative_area_level_1: 'NY',
                postal_code: '11206',
                'does-not-exist': '',
            });
        });
    });
    describe('getAddressComponentsWithCountry', () => {
        it('should find address components by type', () => {
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, {sublocality: 'long_name'})).toStrictEqual({sublocality: 'Brooklyn'});
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, {administrative_area_level_1: 'short_name'})).toStrictEqual({administrative_area_level_1: 'NY'});
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, {postal_code: 'long_name'})).toStrictEqual({postal_code: '11206'});
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, {'does-not-exist': 'long_name'})).toStrictEqual({'does-not-exist': ''});
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, {country: 'long_name'})).toStrictEqual({country: 'United States'});
            expect(GooglePlacesUtils.getAddressComponents(addressComponents, objectWithCountryToFind)).toStrictEqual({
                sublocality: 'Brooklyn',
                administrative_area_level_1: 'NY',
                postal_code: '11206',
                'does-not-exist': '',
                country: 'United States',
            });
        });
    });
    describe('getPlaceAutocompleteTerms', () => {
        it('should find auto complete terms', () => {
            expect(GooglePlacesUtils.getPlaceAutocompleteTerms(autoCompleteTerms)).toStrictEqual({
                country: 'Bangladesh',
                state: 'Bangladesh Border Road',
                city: '',
                street: '',
            });
        });
    });
});
