/**
 * console-shell.tsx: 控制台框架壳子（可复用）
 *
 * 从 @data/projects/common/code/sdk-nav-v2 原封不动复制的完整框架，包含：
 *   - 顶部导航 Nav（Logo + AppList + Search + Setting + UserInfo + Menu）
 *   - 二级导航 SubNav（产品标签栏）
 *   - 左侧菜单 Sider（Tea Menu）
 *   - 内容区 Content（通过 children 注入）
 *
 * 使用方式：
 *   import { ConsoleLayout } from "./console-shell";
 *   <ConsoleLayout>你的页面内容</ConsoleLayout>
 */

import React, {
  useState,
  useEffect,
  useRef,
  useReducer,
  useContext,
  createContext,
  forwardRef,
} from "react";
import {
  SearchBox,
  Bubble,
  Avatar,
  Drawer,
  Dropdown,
  List,
  Popover,
  DropdownBox,
  Button,
  Badge,
  Tag,
  Text,
  Row,
  Col,
  Modal,
  Checkbox,
  Segment,
  Radio,
  Switch,
  Layout,
  Card,
  Menu as TeaMenu,
  Tooltip,
  Collapse,
  Form,
  Select,
} from "@tencent/tea-component";
import {
  CloudproductsIcon,
  EllipsisIcon,
  InterfaceSettingsIcon,
  AllIcon,
  ChevronLeftDoubleIcon,
  MoveIcon,
  ChevronRightIcon,
  CloseIcon,
  TimeIcon,
  ServerIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BoxIcon,
  SearchIcon,
  StarFilledIcon,
  InfoCircleIcon,
  ChevronRightCircleIcon,
  RefreshIcon,
  ErrorCircleIcon,
  LoadingIcon,
  DeleteIcon,
  BrowseOffIcon,
  CloseCircleFilledIcon,
  CheckCircleFilledIcon,
} from "@tencent/tea-icons-react";
import classNames from "classnames";

const clsPrefix = "sdk-nav-v2-nav";

// ====================================================================
// LanguageProvider (from modules/nav/LanguageProvider.jsx)
// ====================================================================
const LanguageContext = createContext("中文");
const LanguageDispatchContext = createContext<any>(null);

const languageReducer = (state: string, action: any) => {
  switch (action.type) {
    case "set":
      return action.payload;
    default:
      throw new Error();
  }
};

const useDispatchLanguage = () => useContext(LanguageDispatchContext);
const useLanguage = () => useContext(LanguageContext);

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, dispatch] = useReducer(languageReducer, "中文");
  return (
    <LanguageContext.Provider value={language}>
      <LanguageDispatchContext.Provider value={dispatch}>
        {children}
      </LanguageDispatchContext.Provider>
    </LanguageContext.Provider>
  );
};

// ====================================================================
// LogoIcon (from modules/nav/LogoIcon.jsx — 中英文双版 SVG)
// ====================================================================
const LogoIcon = ({ type = "zh" }: { type?: string }) =>
  type === "zh" ? (
    <svg
      width="80"
      height="24"
      viewBox="0 0 80 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M41.1544 4.25781H42.381C42.444 4.25781 42.495 4.27655 42.4818 4.37093C42.3919 5.02244 42.2946 5.6173 42.1866 6.16473L42.1036 6.56655H43.6265L44.1261 4.8756H45.2036C45.2581 4.8756 45.3025 4.90803 45.2776 4.99181L44.8133 6.56655H46.0537V7.70002H41.8194C41.7276 8.01568 41.629 8.31299 41.5224 8.59472L41.4131 8.87137H46.3642V10.0049H44.665C45.3743 11.0064 46.126 11.5345 46.5316 11.7903L46.6791 11.8814V13.1781C46.6791 13.2434 46.6273 13.3127 46.4213 13.1964C45.9564 12.9338 45.4518 12.5991 44.947 12.1662L44.6948 11.9415L44.643 14.1456H46.2149V19.6034H42.1994L41.8524 18.4709C41.8265 18.4011 41.8517 18.3618 41.8942 18.3488L41.9288 18.344H44.8227V15.2791H38.4019C38.3679 15.2791 38.3414 15.2606 38.3304 15.2329L38.3247 15.2025L38.4445 13.0541H39.6346C39.6685 13.0541 39.6951 13.0725 39.7062 13.1002L39.7119 13.1306L39.6553 14.1456H43.3769L43.4167 12.4481H38.7029C38.2979 12.7459 37.8981 12.985 37.5235 13.1964C37.3433 13.2982 37.281 13.2578 37.2683 13.2024L37.2656 13.1781V11.8814L37.4934 11.7391C37.8832 11.4864 38.5173 11.0182 39.1387 10.2L39.2817 10.0049H37.2778V8.87137H39.9457C40.0809 8.57755 40.2095 8.26706 40.3137 7.97907L40.4092 7.70002H37.5881V6.56655H38.7961L38.3317 4.99181C38.312 4.92478 38.3363 4.89063 38.3749 4.87964L38.4059 4.8756H39.4834L39.9828 6.56655H40.73C40.8699 5.98542 40.9843 5.37062 41.0911 4.68094L41.1544 4.25781ZM61.5295 4.86719V18.2566H62.7664V19.5166H60.1375V11.9777H56.8085V19.6782H55.4161V11.9777H52.3984V10.7183H55.4161V6.12665H52.7829V4.86719H61.5295ZM51.323 8.86328V17.0507L53.6704 15.2807C53.7102 15.2506 53.7667 15.2629 53.7877 15.3039L53.7959 15.3399V16.7664L49.9565 19.6613L49.1926 18.657L49.9401 18.0933V10.2487H48.0703V8.86328H51.323ZM36.8703 19.6065V4.90039H32.5689V13.8268L32.5664 14.2776C32.5432 16.348 32.3572 17.9581 31.9998 19.3959C31.9594 19.5386 32.0028 19.5767 32.078 19.5767H33.3469L33.4269 19.1584C33.7779 17.2288 33.8265 15.6202 33.8333 14.4314H35.6069V18.347H34.3474L34.3128 18.3519C34.2704 18.3648 34.2451 18.4042 34.271 18.474L34.6179 19.6065H36.8703ZM78.2458 11.8249V10.4395H64.1641V11.8249H68.0709L65.225 19.2628C65.203 19.324 65.2433 19.3696 65.2968 19.3696H77.4428L77.4739 19.3633C77.5111 19.3472 77.529 19.3025 77.5126 19.2597L75.7016 14.5218H74.1897L74.1582 14.5279C74.1207 14.5437 74.1018 14.5871 74.1171 14.6271L75.3986 17.9843H67.3453L69.6965 11.8249H78.2458ZM44.1742 16.1562V17.4157H37.2734V16.1562H44.1742ZM35.6083 10.2832H33.8359V13.2974H35.6083V10.2832ZM43.1138 10.0039H40.8607C40.6286 10.4115 40.3829 10.7688 40.1292 11.0845L39.9375 11.3136H44.0806C43.7436 10.9333 43.417 10.5002 43.1138 10.0039ZM60.1415 6.12891H56.8125V10.7204H60.1415V6.12891ZM35.6083 6.16016H33.8359V9.1505H35.6083V6.16016ZM48.266 4.58984H49.7875L51.7066 7.50638C51.7305 7.54245 51.7176 7.5963 51.6769 7.6164L51.6414 7.62434H50.12L48.1985 4.7041C48.1731 4.66556 48.1946 4.61556 48.2338 4.5971L48.266 4.58984ZM76.7057 6.58847V5.20312H65.7188V6.58847H76.7057Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M22.759 17.9078C22.2998 18.3616 21.4804 18.8769 20.1351 18.9224C19.5133 18.9434 18.7866 18.9459 18.4543 18.9459H11.2266C13.8562 16.3965 16.1502 14.1731 16.4105 13.9207C16.6487 13.6898 17.185 13.1777 17.6474 12.7621C18.6629 11.8496 19.5768 11.666 20.2232 11.672C21.2362 11.6813 22.1572 12.0941 22.8154 12.7606C24.2241 14.1976 24.1906 16.4937 22.759 17.9078ZM24.4885 11.1246C23.4085 10.0253 21.9032 9.33277 20.2298 9.33277C18.7833 9.33241 17.5378 9.83027 16.4502 10.7139C15.9764 11.0993 15.4794 11.5605 14.8536 12.1669C14.6461 12.3683 10.5467 16.338 7.85501 18.9446C7.48031 18.9433 6.94187 18.9379 6.46447 18.9219C5.11919 18.8764 4.29984 18.3611 3.84053 17.9073C2.40902 16.4932 2.37554 14.1971 3.78427 12.7601C4.44242 12.0935 5.36384 11.6808 6.37644 11.6715C7.01109 11.669 7.87257 11.853 8.84556 12.6583L8.84574 12.6582C9.31037 13.0426 10.3419 13.9476 10.7945 14.355C10.8176 14.3757 10.8453 14.3776 10.8723 14.3555L12.4692 12.8004C12.4968 12.7737 12.4952 12.7376 12.4679 12.713C11.7 12.0202 10.6113 11.0507 9.95591 10.5637C9.26735 10.0495 8.52504 9.68366 7.72063 9.49079C7.72882 9.49259 7.73737 9.49366 7.74601 9.49537C8.28823 6.91148 10.5771 4.99227 13.2987 4.99227C15.5656 4.99227 17.5542 6.35667 18.451 8.29043C18.4648 8.32106 18.4888 8.33104 18.5133 8.32421C19.1876 8.13924 19.9959 8.03171 20.7768 8.08938C20.8527 8.09504 20.8823 8.05201 20.8577 7.98293C19.7555 4.87665 16.7887 2.65039 13.2987 2.65039C9.29552 2.65039 5.97815 5.58841 5.37734 9.41533C5.37914 9.41533 5.38094 9.41569 5.38274 9.41533C4.10767 9.62851 2.97239 10.2459 2.10912 11.1246C-0.204564 13.4846 -0.168921 17.2558 2.20146 19.5791C3.15313 20.5119 4.30623 21.0194 5.53603 21.1909H5.53566C6.00776 21.2581 6.657 21.2781 7.23638 21.2817C7.77878 21.2853 18.1279 21.2841 18.5611 21.2841C19.4332 21.2841 20.0005 21.2835 20.6102 21.2389C22.0079 21.1369 23.3286 20.6254 24.3961 19.5791C26.7665 17.2558 26.8023 13.4846 24.4885 11.1246Z"
        fill="currentColor"
      />
    </svg>
  ) : null;

// ====================================================================
// Logo (from modules/nav/Logo.jsx — Bubble + 控制台)
// ====================================================================
const Logo = () => {
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--color-cloud-app-brand-color",
      "#03329E"
    );
    document.documentElement.style.setProperty(
      "--color-cloud-app-brand-color-alpha",
      "rgba(3, 50, 158, 0.15)"
    );
  }, []);

  return (
    <div className={`${clsPrefix}-logo`}>
      <Bubble content="前往腾讯云官网" placement="bottom-start">
        <div className={`${clsPrefix}-logo-cloud-tencent`}>
          <LogoIcon type="zh" />
        </div>
      </Bubble>
      <Bubble content="前往控制台总览" placement="bottom-start">
        <a className={`${clsPrefix}-logo-console`}>
          <CloudproductsIcon size={16} />
          <span className={`${clsPrefix}-logo-text`}>控制台</span>
        </a>
      </Bubble>
    </div>
  );
};

// ====================================================================
// AppList (from modules/nav/AppList.jsx — 最近访问 + 更多Dropdown)
// ====================================================================
const AppList = () => (
  <div className={`${clsPrefix}-app`}>
    <div className={`${clsPrefix}-app-list`}>
      <p className={`${clsPrefix}-app-text`}>云服务器</p>
    </div>
  </div>
);

// ====================================================================
// Search (from modules/nav/Search.jsx — Popover + SearchBox + active)
// ====================================================================
const NavSearch = () => {
  const [visible, setVisible] = useState(false);
  return (
    <div className={classNames(`${clsPrefix}-search`, visible && "active")}>
      <SearchBox
        className={`${clsPrefix}-search-input`}
        placeholder="搜索云产品、文档、云API..."
        size="full"
        simple
      />
      <p className={`${clsPrefix}-search-hotkey`}>快捷键 /</p>
    </div>
  );
};

// ====================================================================
// LanguageLabel + LanguageDropdown (from Setting.jsx 内部组件)
// ====================================================================
const LanguageLabel = forwardRef<HTMLParagraphElement>((_, ref) => {
  const language = useLanguage();
  return (
    <p ref={ref} className={`${clsPrefix}-setting-list-text language-label`}>
      {language}
    </p>
  );
});
LanguageLabel.displayName = "LanguageLabel";

const LanguageDropdown = ({ close }: { close: () => void }) => {
  const dispatch = useDispatchLanguage();
  return (
    <div style={{ padding: "calc(var(--tea-space-100)*2) 0" }}>
      <List type="plain">
        <List.Item>
          <List.ItemButton
            onClick={() => {
              dispatch({ type: "set", payload: "中文" });
              close();
            }}
          >
            <List.ItemContent>中文简体</List.ItemContent>
          </List.ItemButton>
        </List.Item>
      </List>
    </div>
  );
};

// ====================================================================
// Setting (from modules/nav/Setting.jsx — 完整复制交互逻辑)
// ====================================================================
const Setting = () => {
  const [settingVisible, setSettingVisible] = useState(false);
  const [stationVisible, setStationVisible] = useState(false);
  const targetRef = useRef<HTMLParagraphElement>(null);

  return (
    <>
      <div className={`${clsPrefix}-setting`}>
        <div className={`${clsPrefix}-setting-list`}>
          {/* 备案 */}
          <p className={`${clsPrefix}-setting-list-text`}>备案</p>
        </div>

        {/* 齿轮设置 (点击弹 Drawer) */}
        <div
          className={`${clsPrefix}-setting-icon`}
          onClick={() => setSettingVisible(true)}
        >
          <InterfaceSettingsIcon size={16} />
        </div>
      </div>

      {/* 设置 Drawer */}
      <Drawer
        visible={settingVisible}
        onClose={() => setSettingVisible(false)}
        title="自定义设置"
        className="sdk-nav-v2-nav-setting-drawer sdk-nav-v2-drawer"
      >
        <NavPanelSetting />
      </Drawer>
    </>
  );
};

// ====================================================================
// UserInfo (from modules/nav/UserInfo.jsx — PC Dropdown + Mobile Drawer)
// ====================================================================
const UserInfo = () => {
  const [visible, setVisible] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [type, setType] = useState("account");

  return (
    <div className={`${clsPrefix}-user-info`}>
      {/* PC 端 Dropdown */}
      <>
        <div className={`${clsPrefix}-user-info-account`}>
          <p className={`${clsPrefix}-user-info-account-name`}>cluo</p>
          <p className={`${clsPrefix}-user-info-account-text`}>主账号</p>
        </div>
        <Avatar color="#0CBF5B" text="Z" height={32} width={32} />
      </>
    </div>
  );
};

// ====================================================================
// ActiveContent enum (from nav-panel-menu/components/SafeTriangleMenu/enum.js)
// ====================================================================
const ActiveContent = {
  Product: "products",
  Recent: "recent",
  Resource: "resource",
  Favorites: "favorites",
  CloudApp: "app-directory",
} as const;

// ====================================================================
// NavPanelMenuOverview (from nav-panel-menu/components/Overview.jsx)
// ====================================================================
const NavPanelMenuOverview = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className = "" }, ref) => (
  <div
    className={classNames("sdk-nav-v2-menu-panel__overview", className)}
    ref={ref}
  >
    {children}
  </div>
));
NavPanelMenuOverview.displayName = "NavPanelMenuOverview";

// ====================================================================
// NavPanelMenuBody (from components/nav-panel-menu-body)
// ====================================================================
const NavPanelMenuBody = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className = "" }, ref) => (
  <div className={classNames("sdk-nav-v2-nav-menu__body", className)} ref={ref}>
    {children}
  </div>
));
NavPanelMenuBody.displayName = "NavPanelMenuBody";

// ====================================================================
// NavPanel / NavPanelBlock (from components/nav-panel/)
// ====================================================================
const NavPanel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={classNames("sdk-nav-v2-nav-panel", className)}>
    {children}
  </div>
);

const NavPanelBlock = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={classNames("sdk-nav-v2-nav-panel-block", className)}>
    {children}
  </div>
);

// ====================================================================
// ThemeModeRadioGroup / ThemeModeRadio (from components/theme-mode-radio-group/)
// 不依赖 @react-aria，用纯 React 实现同样的效果
// ====================================================================
const ThemeModeRadioGroup = ({
  label,
  defaultValue,
  onChange,
  children,
}: {
  label: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children: React.ReactNode;
}) => {
  const [selectedValue, setSelectedValue] = useState(defaultValue || "");

  const handleChange = (value: string) => {
    setSelectedValue(value);
    onChange?.(value);
  };

  return (
    <div className="nav-sdk-v2-theme-mode-setting">
      <h3 className="nav-sdk-v2-theme-mode-setting-title">{label}</h3>
      <div className="nav-sdk-v2-theme-mode-setting-radio-group">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              _selectedValue: selectedValue,
              _onSelect: handleChange,
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

const ThemeModeRadio = ({
  value,
  previewImageUrl,
  description,
  _selectedValue,
  _onSelect,
}: {
  value: string;
  previewImageUrl: string;
  description: string;
  _selectedValue?: string;
  _onSelect?: (v: string) => void;
}) => {
  const isSelected = _selectedValue === value;
  return (
    <label
      className={classNames("nav-sdk-v2-theme-mode-setting-radio", {
        selected: isSelected,
      })}
      onClick={() => _onSelect?.(value)}
    >
      <input
        type="radio"
        name="theme-mode"
        value={value}
        checked={isSelected}
        onChange={() => _onSelect?.(value)}
        style={{ display: "none" }}
      />
      <div className="nav-sdk-v2-theme-mode-setting-radio__preview-wrapper">
        <img
          className="nav-sdk-v2-theme-mode-setting-radio__preview"
          src={previewImageUrl}
        />
        {!isSelected && (
          <div className="nav-sdk-v2-theme-mode-setting-radio__hover">
            <div className="nav-sdk-v2-theme-mode-setting-radio__hover-mask"></div>
          </div>
        )}
        {isSelected && (
          <div className="nav-sdk-v2-theme-mode-setting-radio__selected">
            <CheckCircleFilledIcon />
          </div>
        )}
      </div>
      <div className="nav-sdk-v2-theme-mode-setting-radio__des">
        {description}
      </div>
    </label>
  );
};

// ====================================================================
// MediaRadio / MediaRadioGroup (from nav-panel-setting/MediaRadioGroup.jsx)
// ====================================================================
const MediaRadio = ({
  name,
  title,
  description,
  previewImageUrl,
}: {
  name: string;
  title?: string;
  description?: string;
  previewImageUrl?: string;
}) => (
  <Radio name={name}>
    <div className="sdk-nav-v2-media-radio">
      <div className="sdk-nav-v2-media-radio__left">
        <div className="sdk-nav-v2-media-radio__detail">
          {title && (
            <div className="sdk-nav-v2-media-radio__detail-tit">{title}</div>
          )}
          {description && (
            <div className="sdk-nav-v2-media-radio__detail-des">
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="sdk-nav-v2-media-radio__right">
        {previewImageUrl && (
          <img
            className="sdk-nav-v2-media-radio__preview"
            src={previewImageUrl}
          />
        )}
      </div>
    </div>
  </Radio>
);

const MediaRadioGroup = ({
  label,
  items,
}: {
  label: string;
  items: {
    title: string;
    description: string;
    previewImageUrl: string;
    checked?: boolean;
  }[];
}) => (
  <Form.Item label={label}>
    <div className="sdk-nav-v2-media-radio-group">
      <Radio.Group defaultValue={"0"}>
        {items.map((item, index) => (
          <MediaRadio {...item} name={`${index}`} key={index} />
        ))}
      </Radio.Group>
    </div>
  </Form.Item>
);

// ====================================================================
// LanguagePicker (from nav-panel-setting/LanguagePicker.jsx)
// ====================================================================
const LanguagePicker = () => {
  const [val, setVal] = useState("zh");
  return (
    <Form layout="vertical" className="sdk-nav-v2-nav-panel-setting__language">
      <Form.Item label="语言">
        <Segment
          value={val}
          options={[
            { text: "中文", value: "zh" },
            { text: "English", value: "en" },
          ]}
          onChange={(v: string) => setVal(v)}
        />
      </Form.Item>
    </Form>
  );
};

// ====================================================================
// NavPanelSetting (from modules/nav-panel-setting/index.jsx — 完整自定义设置面板)
// ====================================================================
const settingThemes = [
  {
    id: "1",
    description: "浅色模式",
    previewImageUrl:
      "https://cloudcache.tencent-cloud.com/qcloud/ui/static/tc_console/b59ab075-68e4-4bb0-adc0-9c215a802eed.svg",
  },
  {
    id: "2",
    description: "深色模式",
    previewImageUrl:
      "https://cloudcache.tencent-cloud.com/qcloud/ui/static/tc_console/703fc1c4-35b8-4e22-ad22-b3044f6745e5.svg",
  },
  {
    id: "3",
    description: "混色模式",
    previewImageUrl:
      "https://cloudcache.tencent-cloud.com/qcloud/ui/static/tc_console/b8cc356e-07eb-4255-a608-f013cdda19e2.svg",
  },
  {
    id: "4",
    description: "品牌模式",
    previewImageUrl:
      "https://cloudcache.tencent-cloud.com/qcloud/ui/static/tc_console/fc5d5a38-ade9-457f-bc1a-aeb15c98de17.svg",
  },
];

const settingNavSettings = [
  {
    title: "单层顶部导航",
    description: "顶部导航栏保持一行",
    previewImageUrl:
      "https://cloudcache.tencent-cloud.com/qcloud/ui/static/tc_console/bc9ad9f5-5f01-4bbd-bc43-fe0e18c04b53.svg",
  },
  {
    title: "双顶部导航",
    description: "顶部导航栏保持一行",
    previewImageUrl:
      "https://cloudcache.tencent-cloud.com/qcloud/ui/static/tc_console/9c360f49-0920-4a7d-b4b8-0616e21a71cc.svg",
    checked: true,
  },
];

const settingDocSettings = [
  {
    title: "帮助窗口查看",
    description: "点击文档链接，当前界面打开",
    previewImageUrl:
      "https://cloudcache.tencent-cloud.com/qcloud/ui/static/tc_console/be1c6b85-3d89-4a5a-be19-0b959c2dad4c.svg",
  },
  {
    title: "新页面查看",
    description: "点击文档链接，打开新窗口",
    previewImageUrl:
      "https://cloudcache.tencent-cloud.com/qcloud/ui/static/tc_console/60402806-6b88-4ee1-8306-212d898e5e5b.svg",
    checked: true,
  },
];

const settingNoticeSettings = {
  title: "开启左侧菜单消息提示",
  description: "左侧菜单展示标记与消息数量",
  previewImageUrl:
    "https://cloudcache.tencent-cloud.com/qcloud/ui/static/tc_console/ef12b8db-3511-4e15-a218-087151e00eed.svg",
};

const changeModes = (globalMode: string, navMode?: string) => {
  document.body.setAttribute("theme-mode", globalMode);
  // console-pack.css 中 dark 模式选择器为 [theme-mode=dark][theme-enable=true]，必须同步设置
  document.body.setAttribute("theme-enable", "true");
  // 同步 body class 以匹配 .tea-theme-light / .tea-theme-dark 选择器
  document.body.className =
    globalMode === "dark" ? "tea-theme-dark" : "theme-light";
  const navEl = document.getElementById("sdk-nav-v2");
  if (navEl) navEl.setAttribute("nav-mode", navMode || globalMode);
};

const NavPanelSetting = () => (
  <NavPanel className="sdk-nav-v2-nav-panel-setting">
    <NavPanelBlock>
      <ThemeModeRadioGroup
        label="主题设置"
        defaultValue="1"
        onChange={(e) => {
          switch (e) {
            case "2":
              changeModes("dark");
              break;
            case "3":
              changeModes("mix", "dark");
              break;
            case "4":
              changeModes("brand", "brand");
              break;
            default:
              changeModes("light");
              break;
          }
        }}
      >
        {settingThemes.map((item) => (
          <ThemeModeRadio {...item} value={item.id} key={item.id} />
        ))}
      </ThemeModeRadioGroup>
      <LanguagePicker />
    </NavPanelBlock>
    <NavPanelBlock>
      <Form layout="vertical">
        <MediaRadioGroup label="顶部导航设置" items={settingNavSettings} />
        <Form.Item label="标签栏选择器">
          <Switch defaultValue={true}>
            开启后标签筛选器在顶部导航栏上展示
          </Switch>
        </Form.Item>
        <Form.Item label="地域面板">
          <Switch defaultValue={false}>
            开启后标签筛选器在顶部导航栏上展示
          </Switch>
        </Form.Item>
        <Form.Item label="默认地域设置">
          <div className="sdk-nav-v2-nav-panel-setting-form-item__subtitle">
            每次访问云资源时默认选择的地域
          </div>
          <Select
            appearance="button"
            matchButtonWidth
            size="full"
            value="sz"
            options={[
              { text: "深圳", value: "sz" },
              { text: "广州", value: "gz" },
            ]}
          />
        </Form.Item>
      </Form>
    </NavPanelBlock>
    <NavPanelBlock>
      <Form layout="vertical">
        <MediaRadioGroup label="帮助文档样式" items={settingDocSettings} />
      </Form>
    </NavPanelBlock>
    <NavPanelBlock>
      <Form layout="vertical">
        <Form.Item label="消息提示">
          <Switch>
            <div className="sdk-nav-v2-media-radio">
              <div className="sdk-nav-v2-media-radio__left">
                <div className="sdk-nav-v2-media-radio__detail">
                  <div className="sdk-nav-v2-media-radio__detail-tit">
                    {settingNoticeSettings.title}
                  </div>
                  <div className="sdk-nav-v2-media-radio__detail-des">
                    {settingNoticeSettings.description}
                  </div>
                </div>
              </div>
              <div className="sdk-nav-v2-media-radio__right">
                <img
                  className="sdk-nav-v2-media-radio__preview"
                  src={settingNoticeSettings.previewImageUrl}
                />
              </div>
            </div>
          </Switch>
        </Form.Item>
      </Form>
    </NavPanelBlock>
  </NavPanel>
);

// ====================================================================
// MenuButton (from modules/nav/Menu.jsx — hover→Drawer + fold/unfold 动画)
// ====================================================================
const MenuButton = () => {
  const [visible, setVisible] = useState(false);
  const [menuClass, setMenuClass] = useState("");
  return (
    <>
      <div className={classNames(`${clsPrefix}-menu`, menuClass)}>
        <span className={`${clsPrefix}-menu__line-first`}></span>
        <span className={`${clsPrefix}-menu__line`}></span>
        <span className={`${clsPrefix}-menu__line-last`}></span>
      </div>
    </>
  );
};

// ====================================================================
// LanguageModal (from modules/nav/LanguageModal.jsx)
// ====================================================================
const LanguageModal = () => {
  const [visible, setVisible] = useState(false);
  return (
    <Modal
      className={`${clsPrefix}-language-modal`}
      visible={visible}
      onClose={() => setVisible(false)}
      caption="The current product does not have an English website, has shown you the Chinese content."
    >
      <Modal.Footer>
        <div className={`${clsPrefix}-language-modal-actions`}>
          <Checkbox>Don&apos;t remind again</Checkbox>
          <Button type="primary" className={`${clsPrefix}-language-modal-btn`}>
            Continue
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

// ====================================================================
// Nav 主组件 (from modules/nav/index.jsx)
// ====================================================================
const Nav = () => (
  <div className={clsPrefix}>
    <div className={`${clsPrefix}__left`}>
      <MenuButton />
      <Logo />
      <AppList />
    </div>
    <div className={`${clsPrefix}__right`}>
      <NavSearch />
      <Setting />
      <UserInfo />
    </div>
    <LanguageModal />
  </div>
);

// ====================================================================
// ConsoleLayout: 可复用的控制台框架壳子
// ====================================================================
const siderIcon =
  "https://cloudcache.tencentcs.com/qcloud/ui/static/console_aside_v5/808b4bc6-761b-4aa2-ac62-53ec1d4eacb2-light.svg";

export interface ConsoleLayoutProps {
  children?: React.ReactNode;
  /** 自定义侧边栏内容（传入时替换默认菜单） */
  siderContent?: React.ReactNode;
}

// 监听全局 theme-mode 变化，返回当前主题（用于同步左侧菜单 theme）
function useGlobalThemeMode(): "light" | "dark" {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    const attr = document.body.getAttribute("theme-mode");
    return attr === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const attr = document.body.getAttribute("theme-mode");
      // dark / mix / brand 模式下，左侧菜单均使用 dark 主题
      setMode(attr && attr !== "light" ? "dark" : "light");
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["theme-mode"],
    });
    return () => observer.disconnect();
  }, []);

  return mode;
}

export function ConsoleLayout({ children, siderContent }: ConsoleLayoutProps) {
  const [selected, setSelected] = useState("overview");
  const [subNavCollapsed, setSubNavCollapsed] = useState(true);
  const menuTheme = useGlobalThemeMode();
  const getMenuItemProps = (id: string) => ({
    selected: selected === id,
    onClick: () => setSelected(id),
  });

  const defaultSider = (
    <TeaMenu
      collapsable
      theme={menuTheme}
      title="产品名称"
      icon="https://via.placeholder.com/32.png?text=icon"
      tag="NEW"
    >
      <TeaMenu.Item
        icon={siderIcon}
        tag="NEW"
        title="一级菜单"
        {...getMenuItemProps("1")}
      />
      <TeaMenu.SubMenu defaultOpened title="一级菜单" icon={siderIcon}>
        <TeaMenu.Item tag="NEW" title="二级菜单" {...getMenuItemProps("2-1")} />
        <TeaMenu.Item
          tag={<Badge theme="success">FREE</Badge>}
          title="二级菜单"
          {...getMenuItemProps("2-2")}
        />
        <TeaMenu.Item title="二级菜单" {...getMenuItemProps("2-3")} />
        <TeaMenu.Item title="二级菜单" {...getMenuItemProps("2-4")} />
        <TeaMenu.Item title="二级菜单" {...getMenuItemProps("2-5")} />
        <TeaMenu.Item title="二级菜单" {...getMenuItemProps("2-6")} />
        <TeaMenu.Item title="二级菜单" {...getMenuItemProps("2-7")} />
      </TeaMenu.SubMenu>
      <TeaMenu.Group title="菜单分组">
        <TeaMenu.SubMenu title="一级菜单" icon={siderIcon}>
          <TeaMenu.Item
            title="二级菜单"
            icon={siderIcon}
            {...getMenuItemProps("3-1")}
          />
          <TeaMenu.Item title="二级菜单" {...getMenuItemProps("3-2")} />
        </TeaMenu.SubMenu>
        <TeaMenu.Item icon={siderIcon} title="外部链接" external />
      </TeaMenu.Group>
      <TeaMenu.Item
        icon={siderIcon}
        title="一级菜单"
        {...getMenuItemProps("4")}
      />
      <TeaMenu.Item
        icon={siderIcon}
        title="一级菜单"
        {...getMenuItemProps("5")}
      />
      <TeaMenu.Item
        icon={siderIcon}
        title="一级菜单"
        {...getMenuItemProps("6")}
      />
      <TeaMenu.Item
        icon={siderIcon}
        title="一级菜单"
        {...getMenuItemProps("7")}
      />
      <TeaMenu.Item
        icon={siderIcon}
        title="一级菜单"
        {...getMenuItemProps("8")}
      />
      <TeaMenu.Item
        icon={siderIcon}
        title="一级菜单"
        {...getMenuItemProps("9")}
      />
      <TeaMenu.Item
        icon={siderIcon}
        title="一级菜单"
        {...getMenuItemProps("10")}
      />
    </TeaMenu>
  );

  return (
    <Layout>
      <Layout.Header style={{ height: subNavCollapsed ? "50px" : "100px" }}>
        <div
          id="sdk-nav-v2"
          className="sdk-nav-v2"
          {...({ "nav-mode": "light" } as any)}
        >
          <Nav />
        </div>
      </Layout.Header>
      <Layout.Body>
        <Layout.Sider>{siderContent || defaultSider}</Layout.Sider>
        <Layout.Content>{children}</Layout.Content>
      </Layout.Body>
    </Layout>
  );
}
