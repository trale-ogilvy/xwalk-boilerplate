import {
  getBasePathBasedOnEnv,
  fetchPlaceholders,
  getLanguage,
  getSite,
} from "../../scripts/utils.js";
import { supportedLangs, supportedSites } from "../../constants.js";

const lang = getLanguage(supportedLangs) || "en";
export const site = getSite(supportedSites) || "capella-singapore";
export const placeholders = await fetchPlaceholders();

export const FILTER_PILL_CLASS = "pill-dropdown-button";
export const FILTER_DROPDOWN_CLASS = "programs-filter-dropdown";
export const FILTER_DONE_BTN_CLASS = "programs-filter-done-btn";
export const FILTER_SELECT_ALL_BTN_CLASS = "programs-filter-select-all-btn";
export const FILTER_WRAPPER_CLASS = "programs-filter-container";

export const EVENTS_PER_PAGE = 12;
export const EVENTS_API_URL =
  getBasePathBasedOnEnv() +
  `/graphql/execute.json/CHG/GetEvents;site=/content/dam/patina/${site};lang=${lang};`;
export const ARTISTS_API_URL =
  getBasePathBasedOnEnv() +
  `/graphql/execute.json/CHG/GetArtists;site=/content/dam/patina/${site};lang=${lang};`;
export const ACTIVITY_API_URL =
  getBasePathBasedOnEnv() +
  `/graphql/execute.json/CHG/GetActivities;site=/content/dam/patina/${site};lang=${lang};`;
export const FESTIVE_API_URL =
  getBasePathBasedOnEnv() +
  `/graphql/execute.json/CHG/GetFestivities;site=/content/dam/patina/${site};lang=${lang};`;

export const categoriesMap = {
  activity: {
    all: placeholders?.programsActivityFilterAll || "All Activities",
    adventure: placeholders?.programsActivityFilterAdventure || "Adventure",
    "destination-dining":
      placeholders?.programsActivityFilterDestinationDining ||
      "Destination Dining",
    "culture-craft":
      placeholders?.programsActivityFilterCultureCraft || "Culture & Craft",
    family: placeholders?.programsActivityFilterFamily || "Family",
    wellbeing: placeholders?.programsActivityFilterWellbeing || "Wellbeing",
  },
  artist: {
    all: placeholders?.programsArtistFilterAll || "Full Line Up",
    "creative-artistry":
      placeholders?.programsArtistFilterCreativeArtistry || "Creative Artistry",
    "sonic-immersion":
      placeholders?.programsArtistFilterSonicImmersion || "Sonic Immersion",
    "body-mind-soul":
      placeholders?.programsArtistFilterBodyMindSoul || "Body, Mind and Soul",
    "nature-amplified":
      placeholders?.programsArtistFilterNatureAmplified || "Nature Amplified",
    "culinary-exploration":
      placeholders?.programsArtistFilterCulinaryExploration ||
      "Culinary Exploration",
  },
  festive: {
    all: placeholders?.programsFestiveFilterAll || "All Oceanic Festivities",
    "active-celebrations":
      placeholders?.programsFestiveFilterActiveCelebrations ||
      "Active Celebrations",
    "culinary-experiences":
      placeholders?.programsFestiveFilterCulinaryExperiences ||
      "Culinary Experiences",
    "family-festivities":
      placeholders?.programsFestiveFilterFamilyFestivities ||
      "Family Festivities",
    "ocean-connection":
      placeholders?.programsFestiveFilterOceanConnection || "Ocean Connection",
    wellbeing: placeholders?.programsFestiveFilterWellbeing || "Wellbeing",
  },
  events: {
    maldives: {
      categories: {
        wellbeing: placeholders?.programsEventFilterWellbeing || "Wellbeing",
        connection: placeholders?.programsEventFilterConnection || "Connection",
        nourishment:
          placeholders?.programsEventFilterNourishment || "Nourishment",
        growth: placeholders?.programsEventFilterGrowth || "Growth",
      },
      subcategories: {
        "wellness-activities":
          placeholders?.programsEventSubFilterWellnessActivities ||
          "Wellness Activities",
        social: placeholders?.programsEventSubFilterSocial || "Social",
        music: placeholders?.programsEventSubFilterMusic || "Music",
        "culinary-experiences":
          placeholders?.programsEventSubFilterCulinaryExperiences ||
          "Culinary Experiences",
        workshops: placeholders?.programsEventSubFilterWorkshops || "Workshops",
        sustainability:
          placeholders?.programsEventSubFilterSustainability ||
          "Sustainability",
      },
    },
    osaka: {
      categories: {
        wellbeing: placeholders?.programsEventFilterWellbeing || "Wellbeing",
        growth: placeholders?.programsEventFilterGrowth || "Growth",
        connection: placeholders?.programsEventFilterConnection || "Connection",
        nourishment:
          placeholders?.programsEventFilterNourishment || "Nourishment",
      },
      subcategories: {
        "wellness-activities":
          placeholders?.programsEventSubFilterWellnessActivities ||
          "Wellness Activities",
        "art-and-design":
          placeholders?.programsEventSubFilterArtAndDesign || "Art & Design",
        sustainability:
          placeholders?.programsEventSubFilterSustainability ||
          "Sustainability",
        music: placeholders?.programsEventSubFilterMusic || "Music",
        workshops: placeholders?.programsEventSubFilterWorkshops || "Workshops",
        "culinary-experiences":
          placeholders?.programsEventSubFilterCulinaryExperiences ||
          "Culinary Experiences",
      },
    },
  },
};

export const ACTIVITY_CATEGORIES = [
  {
    label: categoriesMap.activity["all"],
    value: "all",
  },
  {
    label: categoriesMap.activity["adventure"],
    value: "adventure",
  },
  {
    label: categoriesMap.activity["destination-dining"],
    value: "destination-dining",
  },
  {
    label: categoriesMap.activity["culture-craft"],
    value: "culture-craft",
  },
  {
    label: categoriesMap.activity["family"],
    value: "family",
  },
  {
    label: categoriesMap.activity["wellbeing"],
    value: "wellbeing",
  },
];

export const ARTISTS_CATEGORIES = [
  {
    label: categoriesMap.artist["all"],
    value: "all",
  },
  {
    label: categoriesMap.artist["creative-artistry"],
    value: "creative-artistry",
  },

  {
    label: categoriesMap.artist["sonic-immersion"],
    value: "sonic-immersion",
  },
  {
    label: categoriesMap.artist["body-mind-soul"],
    value: "body-mind-soul",
  },
  {
    label: categoriesMap.artist["nature-amplified"],
    value: "nature-amplified",
  },
  {
    label: categoriesMap.artist["culinary-exploration"],
    value: "culinary-exploration",
  },
];

export const FESTIVE_CATEGORIES = [
  {
    label: categoriesMap.festive["all"],
    value: "all",
  },
  {
    label: categoriesMap.festive["active-celebrations"],
    value: "active-celebrations",
  },
  {
    label: categoriesMap.festive["culinary-experiences"],
    value: "culinary-experiences",
  },
  {
    label: categoriesMap.festive["family-festivities"],
    value: "family-festivities",
  },
  {
    label: categoriesMap.festive["ocean-connection"],
    value: "ocean-connection",
  },
  {
    label: categoriesMap.festive["wellbeing"],
    value: "wellbeing",
  },
];

// categories, subcategories
export const OSAKA_EVENTS_CATEGORIES = {
  categories: [
    {
      label: categoriesMap.events.osaka.categories["wellbeing"],
      value: "Wellbeing",
      subcategories: [
        {
          label:
            categoriesMap.events.osaka.subcategories["wellness-activities"],
          value: "Wellness Activities",
        },
      ],
    },
    {
      label: categoriesMap.events.osaka.categories["growth"],
      value: "Growth",
      subcategories: [
        {
          label: categoriesMap.events.osaka.subcategories["art-and-design"],
          value: "Art & Design",
        },
        {
          label: categoriesMap.events.osaka.subcategories["sustainability"],
          value: "Sustainability",
        },
      ],
    },
    {
      label: categoriesMap.events.osaka.categories["connection"],
      value: "Connection",
      subcategories: [
        {
          label: categoriesMap.events.osaka.subcategories["music"],
          value: "Music",
        },
      ],
    },
    {
      label: categoriesMap.events.osaka.categories["nourishment"],
      value: "Nourishment",
      subcategories: [
        {
          label: categoriesMap.events.osaka.subcategories["workshops"],
          value: "Workshops",
        },
        {
          label:
            categoriesMap.events.osaka.subcategories["culinary-experiences"],
          value: "Culinary Experiences",
        },
      ],
    },
  ],
  subcategories: [
    {
      label: categoriesMap.events.osaka.subcategories["wellness-activities"],
      value: "Wellness Activities",
    },
    {
      label: categoriesMap.events.osaka.subcategories["art-and-design"],
      value: "Art & Design",
    },
    {
      label: categoriesMap.events.osaka.subcategories["sustainability"],
      value: "Sustainability",
    },
    {
      label: categoriesMap.events.osaka.subcategories["music"],
      value: "Music",
    },
    {
      label: categoriesMap.events.osaka.subcategories["social"],
      value: "Social",
    },
    {
      label: categoriesMap.events.osaka.subcategories["workshops"],
      value: "Workshops",
    },
    {
      label: categoriesMap.events.osaka.subcategories["culinary-experiences"],
      value: "Culinary Experiences",
    },
  ],
};

export const MALDIVES_EVENTS_CATEGORIES = {
  categories: [
    {
      label: categoriesMap.events.maldives.categories["wellbeing"],
      value: "Wellbeing",
      subcategories: [
        {
          label:
            categoriesMap.events.maldives.subcategories["wellness-activities"],
          value: "Wellness Activities",
        },
      ],
    },
    {
      label: categoriesMap.events.maldives.categories["connection"],
      value: "Connection",
      subcategories: [
        {
          label: categoriesMap.events.maldives.subcategories["social"],
          value: "Social",
        },
        {
          label: categoriesMap.events.maldives.subcategories["music"],
          value: "Music",
        },
      ],
    },
    {
      label: categoriesMap.events.maldives.categories["nourishment"],
      value: "Nourishment",
      subcategories: [
        {
          label:
            categoriesMap.events.maldives.subcategories["culinary-experiences"],
          value: "Culinary Experiences",
        },
      ],
    },
    {
      label: categoriesMap.events.maldives.categories["growth"],
      value: "Growth",
      subcategories: [
        {
          label: categoriesMap.events.maldives.subcategories["workshops"],
          value: "Workshops",
        },
        {
          label: categoriesMap.events.maldives.subcategories["sustainability"],
          value: "Sustainability",
        },
      ],
    },
  ],
  subcategories: [
    {
      label: categoriesMap.events.maldives.subcategories["wellness-activities"],
      value: "Wellness Activities",
    },
    {
      label: categoriesMap.events.maldives.subcategories["social"],
      value: "Social",
    },
    {
      label: categoriesMap.events.maldives.subcategories["music"],
      value: "Music",
    },
    {
      label:
        categoriesMap.events.maldives.subcategories["culinary-experiences"],
      value: "Culinary Experiences",
    },
    {
      label: categoriesMap.events.maldives.subcategories["workshops"],
      value: "Workshops",
    },
    {
      label: categoriesMap.events.maldives.subcategories["sustainability"],
      value: "Sustainability",
    },
  ],
};

export const eventsCategoryMap = {
  maldives: MALDIVES_EVENTS_CATEGORIES,
  osaka: OSAKA_EVENTS_CATEGORIES,
};
