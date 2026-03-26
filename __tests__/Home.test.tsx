// tests/Home.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "../src/app/page"; // 根據實際路徑調整
import { TitleContext } from "../src/app/(context)/title/TitleContext";

vi.mock("next/head", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// 建立一個 Wrapper 來提供 TitleContext
const renderWithContext = (ui: React.ReactNode, title = "測試標題") => {
  return render(
    <TitleContext.Provider value={{ title, setTitle: vi.fn() }}>
      {ui}
    </TitleContext.Provider>,
  );
};

describe("Home Component", () => {
  beforeEach(() => {
    // Reset window.location mock
    vi.restoreAllMocks();
  });

  it("應該正確渲染標題文字", () => {
    renderWithContext(<Home />);
    expect(
      screen.getByRole("heading", { name: "歡迎來到小雨的公路資料網站" }),
    ).toBeInTheDocument();
  });

  it("應該顯示 TitleContext 的標題在 <title>", async () => {
    renderWithContext(<Home />, "自訂標題");

    // 方式 B：抓 <title> 元素
    const titleElement = document.querySelector("title");
    expect(titleElement).not.toBeNull();
    expect(titleElement?.textContent).toBe("自訂標題");
  });

  it("應該渲染路線一覽按鈕", async () => {
    renderWithContext(<Home />, "自訂標題");
    const buttons = await screen.findAllByRole("button", { name: "路線一覽" });
    expect(buttons[0]).toBeInTheDocument();
  });

  it("點擊首頁的路線一覽按鈕應該導向 /railways", () => {
    renderWithContext(<Home />);

    // Mock window.location
    const mockLocation = { href: "" };
    vi.stubGlobal("window", { location: mockLocation });

    // 用 getAllByRole 找到所有按鈕，選第一顆 (首頁的)
    const buttons = screen.getAllByRole("button", { name: "路線一覽" });
    fireEvent.click(buttons[0]);

    expect(window.location.href).toBe("/railways");
  });
});
