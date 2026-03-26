// __tests__/railways/LinePage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LinePageClient from "../../src/app/railways/LinePageClient";
import { TitleContext } from "../../src/app/(context)/title/TitleContext";

const mockLines = [
  {
    id: 1,
    name: "縱貫線",
    co: 1,
    district: [{ districtID: 1, districtName: "台北" }],
  },
  {
    id: 2,
    name: "平溪線",
    co: 1,
    district: [{ districtID: 2, districtName: "瑞芳" }],
  },
];

describe("LinePageClient Component", () => {
  let setTitleMock: (title: string) => void;

  beforeEach(() => {
    setTitleMock = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("初始應該顯示 Loading", () => {
    render(
      <TitleContext.Provider value={{ title: "", setTitle: setTitleMock }}>
        <LinePageClient lines={mockLines} />
      </TitleContext.Provider>,
    );

    expect(screen.getByText(/Loading data/i)).toBeInTheDocument();
  });

  it("載入完成後應該渲染所有鐵路資料", async () => {
    render(
      <TitleContext.Provider value={{ title: "", setTitle: setTitleMock }}>
        <LinePageClient lines={mockLines} />
      </TitleContext.Provider>,
    );

    // 等待 loading 消失，client useEffect 延遲為 100ms
    await waitFor(() => {
      expect(screen.queryByText(/Loading data/i)).not.toBeInTheDocument();
    });

    // 資料是否正確渲染
    expect(screen.getByText("🚉 鐵路總覽")).toBeInTheDocument();
    expect(screen.getByText("縱貫線")).toBeInTheDocument();
    expect(screen.getByText("平溪線")).toBeInTheDocument();
  });

  it("應該呼叫 setTitle 並更新 document.title", async () => {
    render(
      <TitleContext.Provider value={{ title: "", setTitle: setTitleMock }}>
        <LinePageClient lines={mockLines} />
      </TitleContext.Provider>,
    );

    await waitFor(() => {
      expect(setTitleMock).toHaveBeenCalledWith("鐵路總覽");
      expect(document.title).toBe("鐵路總覽");
    });
  });

  it("所有路線都應該生成 Link 元件", async () => {
    render(
      <TitleContext.Provider value={{ title: "", setTitle: setTitleMock }}>
        <LinePageClient lines={mockLines} />
      </TitleContext.Provider>,
    );

    await waitFor(() => {
      const links = screen.getAllByRole("link");
      expect(links.length).toBe(mockLines.length);
      expect(links[0]).toHaveAttribute("href", "railways/1");
      expect(links[1]).toHaveAttribute("href", "railways/2");
    });
  });
});
