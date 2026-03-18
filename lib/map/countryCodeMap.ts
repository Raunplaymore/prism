// ISO 3166-1 numeric → ISO 3166-1 alpha-2 mapping
// Used to convert TopoJSON country IDs (numeric) to alpha-2 codes for API calls

const countryCodeMap: Record<string, string> = {
  '004': 'AF', // Afghanistan
  '008': 'AL', // Albania
  '012': 'DZ', // Algeria
  '020': 'AD', // Andorra
  '024': 'AO', // Angola
  '028': 'AG', // Antigua and Barbuda
  '032': 'AR', // Argentina
  '051': 'AM', // Armenia
  '036': 'AU', // Australia
  '040': 'AT', // Austria
  '031': 'AZ', // Azerbaijan
  '044': 'BS', // Bahamas
  '048': 'BH', // Bahrain
  '050': 'BD', // Bangladesh
  '052': 'BB', // Barbados
  '112': 'BY', // Belarus
  '056': 'BE', // Belgium
  '084': 'BZ', // Belize
  '204': 'BJ', // Benin
  '064': 'BT', // Bhutan
  '068': 'BO', // Bolivia
  '070': 'BA', // Bosnia and Herzegovina
  '072': 'BW', // Botswana
  '076': 'BR', // Brazil
  '096': 'BN', // Brunei
  '100': 'BG', // Bulgaria
  '854': 'BF', // Burkina Faso
  '108': 'BI', // Burundi
  '132': 'CV', // Cabo Verde
  '116': 'KH', // Cambodia
  '120': 'CM', // Cameroon
  '124': 'CA', // Canada
  '140': 'CF', // Central African Republic
  '148': 'TD', // Chad
  '152': 'CL', // Chile
  '156': 'CN', // China
  '170': 'CO', // Colombia
  '174': 'KM', // Comoros
  '178': 'CG', // Congo (Republic)
  '180': 'CD', // Congo (Democratic Republic)
  '188': 'CR', // Costa Rica
  '384': 'CI', // Côte d'Ivoire
  '191': 'HR', // Croatia
  '192': 'CU', // Cuba
  '196': 'CY', // Cyprus
  '203': 'CZ', // Czechia
  '208': 'DK', // Denmark
  '262': 'DJ', // Djibouti
  '212': 'DM', // Dominica
  '214': 'DO', // Dominican Republic
  '218': 'EC', // Ecuador
  '818': 'EG', // Egypt
  '222': 'SV', // El Salvador
  '226': 'GQ', // Equatorial Guinea
  '232': 'ER', // Eritrea
  '233': 'EE', // Estonia
  '748': 'SZ', // Eswatini
  '231': 'ET', // Ethiopia
  '242': 'FJ', // Fiji
  '246': 'FI', // Finland
  '250': 'FR', // France
  '266': 'GA', // Gabon
  '270': 'GM', // Gambia
  '268': 'GE', // Georgia
  '276': 'DE', // Germany
  '288': 'GH', // Ghana
  '300': 'GR', // Greece
  '308': 'GD', // Grenada
  '320': 'GT', // Guatemala
  '324': 'GN', // Guinea
  '624': 'GW', // Guinea-Bissau
  '328': 'GY', // Guyana
  '332': 'HT', // Haiti
  '340': 'HN', // Honduras
  '348': 'HU', // Hungary
  '352': 'IS', // Iceland
  '356': 'IN', // India
  '360': 'ID', // Indonesia
  '364': 'IR', // Iran
  '368': 'IQ', // Iraq
  '372': 'IE', // Ireland
  '376': 'IL', // Israel
  '380': 'IT', // Italy
  '388': 'JM', // Jamaica
  '392': 'JP', // Japan
  '400': 'JO', // Jordan
  '398': 'KZ', // Kazakhstan
  '404': 'KE', // Kenya
  '296': 'KI', // Kiribati
  '408': 'KP', // North Korea
  '410': 'KR', // South Korea
  '414': 'KW', // Kuwait
  '417': 'KG', // Kyrgyzstan
  '418': 'LA', // Laos
  '428': 'LV', // Latvia
  '422': 'LB', // Lebanon
  '426': 'LS', // Lesotho
  '430': 'LR', // Liberia
  '434': 'LY', // Libya
  '438': 'LI', // Liechtenstein
  '440': 'LT', // Lithuania
  '442': 'LU', // Luxembourg
  '450': 'MG', // Madagascar
  '454': 'MW', // Malawi
  '458': 'MY', // Malaysia
  '462': 'MV', // Maldives
  '466': 'ML', // Mali
  '470': 'MT', // Malta
  '584': 'MH', // Marshall Islands
  '478': 'MR', // Mauritania
  '480': 'MU', // Mauritius
  '484': 'MX', // Mexico
  '583': 'FM', // Micronesia
  '498': 'MD', // Moldova
  '492': 'MC', // Monaco
  '496': 'MN', // Mongolia
  '499': 'ME', // Montenegro
  '504': 'MA', // Morocco
  '508': 'MZ', // Mozambique
  '104': 'MM', // Myanmar
  '516': 'NA', // Namibia
  '520': 'NR', // Nauru
  '524': 'NP', // Nepal
  '528': 'NL', // Netherlands
  '554': 'NZ', // New Zealand
  '558': 'NI', // Nicaragua
  '562': 'NE', // Niger
  '566': 'NG', // Nigeria
  '807': 'MK', // North Macedonia
  '578': 'NO', // Norway
  '512': 'OM', // Oman
  '586': 'PK', // Pakistan
  '585': 'PW', // Palau
  '275': 'PS', // Palestine
  '591': 'PA', // Panama
  '598': 'PG', // Papua New Guinea
  '600': 'PY', // Paraguay
  '604': 'PE', // Peru
  '608': 'PH', // Philippines
  '616': 'PL', // Poland
  '620': 'PT', // Portugal
  '634': 'QA', // Qatar
  '642': 'RO', // Romania
  '643': 'RU', // Russia
  '646': 'RW', // Rwanda
  '659': 'KN', // Saint Kitts and Nevis
  '662': 'LC', // Saint Lucia
  '670': 'VC', // Saint Vincent and the Grenadines
  '882': 'WS', // Samoa
  '674': 'SM', // San Marino
  '678': 'ST', // São Tomé and Príncipe
  '682': 'SA', // Saudi Arabia
  '686': 'SN', // Senegal
  '688': 'RS', // Serbia
  '690': 'SC', // Seychelles
  '694': 'SL', // Sierra Leone
  '702': 'SG', // Singapore
  '703': 'SK', // Slovakia
  '705': 'SI', // Slovenia
  '090': 'SB', // Solomon Islands
  '706': 'SO', // Somalia
  '710': 'ZA', // South Africa
  '728': 'SS', // South Sudan
  '724': 'ES', // Spain
  '144': 'LK', // Sri Lanka
  '736': 'SD', // Sudan
  '740': 'SR', // Suriname
  '752': 'SE', // Sweden
  '756': 'CH', // Switzerland
  '760': 'SY', // Syria
  '158': 'TW', // Taiwan
  '762': 'TJ', // Tajikistan
  '834': 'TZ', // Tanzania
  '764': 'TH', // Thailand
  '626': 'TL', // Timor-Leste
  '768': 'TG', // Togo
  '776': 'TO', // Tonga
  '780': 'TT', // Trinidad and Tobago
  '788': 'TN', // Tunisia
  '792': 'TR', // Turkey
  '795': 'TM', // Turkmenistan
  '798': 'TV', // Tuvalu
  '800': 'UG', // Uganda
  '804': 'UA', // Ukraine
  '784': 'AE', // United Arab Emirates
  '826': 'GB', // United Kingdom
  '840': 'US', // United States
  '858': 'UY', // Uruguay
  '860': 'UZ', // Uzbekistan
  '548': 'VU', // Vanuatu
  '336': 'VA', // Vatican City
  '862': 'VE', // Venezuela
  '704': 'VN', // Vietnam
  '887': 'YE', // Yemen
  '894': 'ZM', // Zambia
  '716': 'ZW', // Zimbabwe
  // Territories and special cases in TopoJSON
  '010': 'AQ', // Antarctica
  '074': 'BV', // Bouvet Island
  '086': 'IO', // British Indian Ocean Territory
  '162': 'CX', // Christmas Island
  '166': 'CC', // Cocos Islands
  '184': 'CK', // Cook Islands
  '234': 'FO', // Faroe Islands
  '238': 'FK', // Falkland Islands
  '254': 'GF', // French Guiana
  '258': 'PF', // French Polynesia
  '260': 'TF', // French Southern Territories
  '304': 'GL', // Greenland
  '312': 'GP', // Guadeloupe
  '316': 'GU', // Guam
  '344': 'HK', // Hong Kong
  '446': 'MO', // Macao
  '474': 'MQ', // Martinique
  '175': 'YT', // Mayotte
  '540': 'NC', // New Caledonia
  '570': 'NU', // Niue
  '574': 'NF', // Norfolk Island
  '580': 'MP', // Northern Mariana Islands
  '612': 'PN', // Pitcairn
  '630': 'PR', // Puerto Rico
  '638': 'RE', // Réunion
  '652': 'BL', // Saint Barthélemy
  '654': 'SH', // Saint Helena
  '663': 'MF', // Saint Martin
  '666': 'PM', // Saint Pierre and Miquelon
  '016': 'AS', // American Samoa
  '732': 'EH', // Western Sahara
  '744': 'SJ', // Svalbard and Jan Mayen
  '772': 'TK', // Tokelau
  '796': 'TC', // Turks and Caicos
  '850': 'VI', // US Virgin Islands
  '876': 'WF', // Wallis and Futuna
  '-99': 'XK', // Kosovo (special code used in some TopoJSON)
}

export default countryCodeMap
