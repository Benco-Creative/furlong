import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React, { useState } from "react";
import { DropdownMenu } from "./DropdownMenu";
import { DropdownButton } from "./components/DropdownButton";
import { DropdownContent } from "./components/DropdownContent";
import { DropdownItem } from "./components/DropdownItem";

// import { SelectDropdown } from "./DropdownMenu-copy";
const fruits = [
  {
    id: 1,
    name: "Apple",
    emoji: "🍎",
    description:
      "A sweet and crisp fruit, often red or green, great for snacking and baking.",
    // disabled: true,
  },
  {
    id: 2,
    name: "Banana",
    emoji: "🍌",
    description:
      "A long and curved fruit with a soft, creamy flesh, known for its energy-boosting properties.",
  },
  {
    id: 3,
    name: "Cherry",
    emoji: "🍒",
    description:
      "Small, round, and juicy fruits with a sweet or tart flavor, often used in desserts.",
    // disabled: true,
  },
  {
    id: 4,
    name: "Grapes",
    emoji: "🍇",
    description:
      "Small, juicy fruits that grow in clusters, available in various colors like green, red, and purple.",
  },
  {
    id: 5,
    name: "Orange",
    emoji: "🍊",
    description:
      "A citrus fruit known for its tangy and refreshing taste, rich in vitamin C.",
  },
  {
    id: 6,
    name: "Strawberry",
    emoji: "🍓",
    description:
      "A red, heart-shaped fruit with a sweet flavor and tiny seeds on its surface.",
  },
  {
    id: 7,
    name: "Watermelon",
    emoji: "🍉",
    description:
      "A large, juicy fruit with green rind and red flesh, perfect for summertime snacks.",
  },
  {
    id: 8,
    name: "Peach",
    emoji: "🍑",
    description:
      "A soft, fuzzy fruit with a sweet and slightly tangy taste, often enjoyed fresh or in desserts.",
  },
  {
    id: 9,
    name: "Pineapple",
    emoji: "🍍",
    description:
      "A tropical fruit with spiky skin and sweet, tangy yellow flesh.",
  },
  {
    id: 10,
    name: "Lemon",
    emoji: "🍋",
    description:
      "A bright yellow citrus fruit with a tart flavor, commonly used in drinks and cooking.",
  },
  {
    id: 11,
    name: "Mango",
    emoji: "🥭",
  },
  {
    id: 12,
    name: "Gooseberry",
    emoji: "🍇",
  },
  {
    id: 13,
    name: "Grapefruit",
    emoji: "🍊",
  },
  {
    id: 14,
    name: "Guava",
    emoji: "🍈",
  },
];

const vegetables = [
  // Add 10 vegetables
  {
    id: 12,
    name: "Carrot",
    emoji: "🥕",
    description:
      "A crunchy orange root vegetable, rich in beta-carotene and vitamin A.",
  },
  {
    id: 13,
    name: "Broccoli",
    emoji: "🥦",
    description:
      "A green vegetable with dense, nutritious florets, high in fiber and vitamins.",
  },
  {
    id: 14,
    name: "Tomato",
    emoji: "🍅",
    description:
      "Technically a fruit, but commonly used as a vegetable in cooking.",
  },
  {
    id: 15,
    name: "Eggplant",
    emoji: "🍆",
    description:
      "A purple vegetable with a meaty texture, popular in Mediterranean cuisine.",
  },
  {
    id: 16,
    name: "Corn",
    emoji: "🌽",
    description:
      "Sweet yellow kernels on a cob, enjoyed grilled, boiled, or popped.",
  },
  {
    id: 17,
    name: "Bell Pepper",
    emoji: "🫑",
    description:
      "A crisp, colorful vegetable that can be sweet or slightly bitter.",
  },
  {
    id: 18,
    name: "Cucumber",
    emoji: "🥒",
    description:
      "A refreshing green vegetable with high water content, often used in salads.",
  },
  {
    id: 19,
    name: "Potato",
    emoji: "🥔",
    description:
      "A starchy root vegetable that can be prepared in countless ways.",
  },
  {
    id: 20,
    name: "Mushroom",
    emoji: "🍄",
    description:
      "Technically a fungus, but commonly used as a vegetable in cooking.",
  },
  {
    id: 21,
    name: "Onion",
    emoji: "🧅",
    description:
      "A pungent bulb vegetable used as a base in many cuisines worldwide.",
  },
];

const fruitsAndVegetables = {
  fruits,
  vegetables,
};
// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Example/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    items: [1, 2, 3, 4],
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultDropdown = () => {
  return (
    <DropdownMenu defaultOpen={true}>
      <DropdownButton>
        <button>Click me!!</button>
      </DropdownButton>
      <DropdownContent>
        <div>
          <h1>Hello</h1>
          <p>How are you today?</p>
          <DropdownItem onSelect={(e) => console.log(e)}>
            Click me again
          </DropdownItem>
          <DropdownItem onSelect={(e) => e.preventDefault()}>
            Click me, I won't close
          </DropdownItem>
        </div>
      </DropdownContent>
    </DropdownMenu>
  );
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const MultiSelect = () => {
  const [value, setValue] = useState([fruits[6]]);
  const [items, setItems] = useState([
    ...fruitsAndVegetables.fruits,
    ...fruitsAndVegetables.vegetables,
  ]);

  const handleSearch = async (query: String) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Filters items on the name
    const filteredItems = fruitsAndVegetables.fruits.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setItems(filteredItems);
  };

  return (
    <DropdownMenu
      items={items}
      onSelect={(e, value) => {
        e.preventDefault();
        console.log(e, value);
      }}
      renderItem={(item) => <Fruit fruit={item} />}
      defaultOpen={true}
      onSearch={handleSearch}
      // isItemDisabled={(item) => item.id % 2 === 0}
    >
      <DropdownButton showIcon>
        <div className="flex items-center gap-2 justify-between">
          <Fruit fruit={fruits[1]} />({value.length})
        </div>
      </DropdownButton>

      {items.length === 0 && (
        <DropdownContent>
          <div>No items found</div>
        </DropdownContent>
      )}
    </DropdownMenu>
  );
};

export const NestedDropdown = () => {
  const items = [
    {
      name: "Vegetables",
      children: fruitsAndVegetables.vegetables,
      emoji: "🥦",
    },
    {
      name: "Fruits",
      children: fruitsAndVegetables.fruits,
      emoji: "🍎",
    },
  ];
  return (
    <div>
      <DropdownMenu
        defaultOpen={true}
        items={items}
        renderItem={(item) => <Fruit fruit={item} />}
      >
        <DropdownButton>
          <button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">
            Select
          </button>
        </DropdownButton>
      </DropdownMenu>
    </div>
  );
};
const Fruit = ({ fruit }) => {
  return <div>{`${fruit.emoji} ${fruit.name}`}</div>;
};
