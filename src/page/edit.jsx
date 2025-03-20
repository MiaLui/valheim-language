import React, { useState, useEffect, useRef } from "react";
import "../App.css";

function Edit() {
  const [fileContent, setFileContent] = useState([]);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [patchContent, setPatchContent] = useState(null); // Trạng thái chứa thông tin patch
  const [isBoxVisible, setIsBoxVisible] = useState(false);
  const [isBoxLog, setIsBoxLog] = useState(false);
  const [latestSHA, setLatestSHA] = useState(null);
  const [listSHA, setListSHA] = useState([]);
  const repoOwner = "Valheim-Modding";
  const repoName = "Jotunn";
  const searchText = "docs: updated data for Valheim"; // Chuỗi để tìm kiếm trong commit message
  const [shaMap] = useState({
    English: "11ff831b0ef1699f461d726d8bf3963a5b378c65",
    Abenaki: "39f15a4f73e35fc0015af7587fa4682e6e29681d",
    // Thêm mã SHA cho các ngôn ngữ khác tại đây
  });
  const [editing, setEditing] = useState({
    index: null,
    key: "",
    value: "",
  });
  const [selectedLanguage, setSelectedLanguage] = useState(""); // Trạng thái lưu ngôn ngữ đã chọn
  const [showLanguageBox, setShowLanguageBox] = useState(false); // Hiển thị/hide danh sách ngôn ngữ
  const [ListLanguage, setListLanguage] = useState(false);
  const [languages, setLanguages] = useState([]); // Danh sách ngôn ngữ tải từ API
  const [showAddBox, setShowAddBox] = useState(false); // Trạng thái hiển thị hộp thêm
  const [newlyAddedIndex, setNewlyAddedIndex] = useState(null); // Trạng thái lưu index của key-value vừa thêm
  const [deleteIndex, setDeleteIndex] = useState(null); // Lưu chỉ mục của dòng cần xóa
  const fileInputRef = useRef(null);

  const countryCodes = {
    English: "en",
    Swedish: "sv",
    French: "fr",
    Italian: "it",
    German: "de",
    Spanish: "es",
    Russian: "ru",
    Romanian: "ro",
    Bulgarian: "bg",
    Macedonian: "mk",
    Finnish: "fi",
    Danish: "da",
    Norwegian: "no",
    Icelandic: "is",
    Turkish: "tr",
    Lithuanian: "lt",
    Czech: "cs",
    Hungarian: "hu",
    Slovak: "sk",
    Polish: "pl",
    Dutch: "nl",
    Portuguese_European: "pt-PT",
    Portuguese_Brazilian: "pt-BR",
    Chinese: "zh-CN",
    Chinese_Trad: "zh-TW",
    Japanese: "ja",
    Korean: "ko",
    Hindi: "hi",
    Thai: "th",
    Abenaki: "abn",
    Croatian: "hr",
    Georgian: "ka",
    Greek: "el",
    Serbian: "sr",
    Ukrainian: "uk",
    Latvian: "lv",
    Vietnamese: "vi.txt",
  };
  const fetchCommitsAll = async () => {
    try {
      const personalAccessToken = import.meta.env.VITE_GITHUB_PAT;
      const searchText = "docs: updated data for Valheim";
      const perPage = 35;
      let page = 1;
      let allMatchedCommits = [];
      let hasMoreCommits = true;
      while (hasMoreCommits) {
        const pageGroup = [];
        for (let i = 0; i < 10; i++) {
          pageGroup.push(
            fetch(
              `https://api.github.com/repos/${repoOwner}/${repoName}/commits?per_page=${perPage}&page=${page + i}`,
              {
                headers: {
                  Authorization: `token ${personalAccessToken}`,
                },
              }
            ).then((response) => {
              if (!response.ok) {
                throw new Error("Lỗi khi tải danh sách commit.");
              }
              return response.json();
            })
          );
        }

        const pageResults = await Promise.all(pageGroup);
        const allCommits = pageResults.flat();

        if (allCommits.length === 0) {
          hasMoreCommits = false;
        } else {
          const matchedCommits = allCommits.filter((commit) =>
            commit.commit.message.includes(searchText)
          );

          const commitSHAList = matchedCommits.map((commit) => ({
            sha: commit.sha,
            message: commit.commit.message,
            date: commit.commit.author.date,
          }));

          allMatchedCommits = [...allMatchedCommits, ...commitSHAList];
          page += 5;
        }
      }

      setListSHA(allMatchedCommits);
    } catch (error) {
      console.error("Lỗi:", error);
      setListSHA([]);
    }
  };
  const fetchCommits = async () => {
    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/commits`
    );
    const data = await response.json();

    // Tìm commit mới nhất có message chứa searchText
    const foundCommit = data.find(commit => 
      commit.commit.message.includes(searchText)
    );
    if (foundCommit) {
      setLatestSHA(foundCommit.sha); // Lưu mã SHA của commit
    }
  };
  const renderPatch = (patch) => {
    if (!patch) return null;

    // Phân tích từng dòng của patch
    const lines = patch
      .split("\n")
      .filter(
        (line) =>
          line.startsWith("@@") || line.startsWith("+") || line.startsWith("-")
      );

    return lines.map((line, index) => {
      if (line.startsWith("@@")) {
        // Nếu là dòng @@ -> Bắt đầu đoạn code mới
        // Sử dụng regex để tìm số phiên bản và loại bỏ phần sau nó
        const trimmedLine = line.replace(/(\d+\.\d+\.\d+).*/, "$1");

        return (
          <div key={index} className="diff-hunk-header">
            {trimmedLine}
          </div>
        );
      } else if (line.startsWith("-")) {
        // Nếu là dòng bị xóa (-) -> Màu đỏ
        // Sử dụng regex để loại bỏ phần sau số phiên bản (nếu có)
        const trimmedLine = line.replace(/(\d+\.\d+\.\d+).*/, "$1");

        return (
          <div key={index} className="diff-line-removed">
            {trimmedLine.replace("-", "")} {/* Xóa cả dấu '-' */}
          </div>
        );
      } else if (line.startsWith("+")) {
        // Nếu là dòng thêm vào (+) -> Màu xanh
        // Sử dụng regex để loại bỏ phần sau số phiên bản (nếu có)
        const trimmedLine = line.replace(/(\d+\.\d+\.\d+).*/, "$1");

        return (
          <div key={index} className="diff-line-added">
            {trimmedLine.replace("+", "")} {/* Xóa cả dấu '+' */}
          </div>
        );
      } else {
        // Dòng bình thường, không có + hoặc -
        return (
          <div key={index} className="diff-line">
            {line}
          </div>
        );
      }
    });
  };

  const PatchViewer = ({ patch }) => {
    return <div className="diff-container">{renderPatch(patch)}</div>;
  };
  const fetchPatchContent = (sha) => {
    const personalAccessToken = import.meta.env.VITE_GITHUB_PAT; // Lấy token từ biến môi trường
    const commitUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/commits/${sha}`;
  
    fetch(commitUrl, {
      headers: {
        Authorization: `token ${personalAccessToken}`, // Thêm token vào header
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Không tìm thấy patch cho commit này.");
        }
        return response.json();
      })
      .then((data) => {
        const languageFile = data.files.find((file) =>
          file.filename.includes(selectedLanguage)
        );
        if (!languageFile?.patch) {
          alert(`Không có gì mới.`);
          setIsBoxLog(false);
          return;
        }
        if (languageFile && languageFile.patch) {
          const patch = languageFile.patch;
          setPatchContent(patch); // Lưu patch vào state
        } else {
          throw new Error("Không tìm thấy patch tương ứng.");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi tải patch:", error);
      });
  };
  const handleFileUpload = (e) => {
    const file = e.target.files[0];

    // Kiểm tra nếu tệp tồn tại
    if (file) {
      // Kiểm tra nếu tệp không phải là tệp .txt
      if (file.type !== "text/plain") {
        alert("Vui lòng upload tệp có định dạng .txt!");
        return;
      }

      setUploadedFileName(file.name); // Lưu tên tệp

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;

        // Kiểm tra nếu dữ liệu trong tệp txt trống
        if (!text.trim()) {
          alert("Tệp txt trống!");
          return;
        }

        const lines = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("|") && line.endsWith("|"))
          .map((line) => {
            const match = line.match(/^\|([^|]+)\|([^|]+)\|$/);
            return match
              ? [
                  match[1].replace(/\$/g, "").trim(),
                  match[2].replace(/\$/g, "").trim(),
                ]
              : null;
          })
          .filter(Boolean);

        if (lines.length === 0) {
          alert("Tệp không chứa dữ liệu key-value hợp lệ!");
          return;
        }

        setFileContent(lines);
        setIsFileUploaded(true);
      };

      reader.readAsText(file);
    }
  };
  useEffect(() => {
    fetchCommitsAll();
    fetch(
      "https://raw.githubusercontent.com/Valheim-Modding/Jotunn/refs/heads/prod/JotunnLib/Documentation/data/localization/language-list.md"
    )
      .then((response) => response.text())
      .then((data) => {
        // Tách dòng dữ liệu
        const lines = data.split("\n");

        // Lọc ra các dòng có chứa thông tin bảng (bỏ qua các dòng không cần thiết)
        const tableLines = lines.filter((line) => line.includes("|"));

        // Tạo danh sách từ cột "Localized Name" (cột thứ hai trong bảng)
        const languageList = tableLines
          .slice(2) // Bỏ qua tiêu đề bảng
          .map((line) => line.split("|")[1].trim()); // Cột thứ hai là Localized Name

        setLanguages(languageList);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy danh sách ngôn ngữ:", error);
      });
  }, []);
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  const handleLanguageSelect = (e) => {
    setSelectedLanguage(e.target.value); // Cập nhật ngôn ngữ đã chọn
  };
  const handleFetchTranslation = () => {
    if (selectedLanguage) {
      const langFileUrl = `https://raw.githubusercontent.com/Valheim-Modding/Jotunn/refs/heads/prod/JotunnLib/Documentation/data/localization/translations/${selectedLanguage}.md`;

      fetch(langFileUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Ngôn ngữ không tồn tại hoặc lỗi khi tải tài liệu."
            );
          }
          return response.text();
        })
        .then((data) => {
          const lines = data
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.startsWith("|") && line.endsWith("|"))
            .map((line) => {
              const match = line.match(/^\|([^|]+)\|([^|]+)\|$/);
              return match
                ? [
                    match[1].replace(/\$/g, "").trim(),
                    match[2].replace(/\$/g, "").trim(),
                  ]
                : null;
            })
            .filter(Boolean);

          if (lines.length === 0) {
            alert("Tài liệu không chứa dữ liệu key-value hợp lệ!");
            return;
          }

          setFileContent(lines); // Lưu nội dung key-value từ file dịch
          setIsFileUploaded(true);
          setUploadedFileName(`${selectedLanguage}.txt`); // Lưu tên file
        })
        .catch((error) => {
          console.error("Lỗi khi tải tài liệu dịch:", error);
          alert("Không tải được tài liệu ngôn ngữ.");
        });
    }
  };
  const filteredContent = fileContent.filter(
    ([key, value]) =>
      key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (index, currentKey, currentValue) => {
    if (deleteIndex === null) {
      // Chỉ mở hộp thêm nếu không có hộp xóa
      setEditing({ index, key: currentKey, value: currentValue });
      setShowAddBox(true); // Dùng hộp thoại chung để chỉnh sửa và thêm
    }
  };

  const handleAddSave = () => {
    const updatedContent = [...fileContent];
    if (editing.index !== null) {
      // Chỉnh sửa key-value
      updatedContent[editing.index] = [editing.key, editing.value];
    } else {
      // Thêm key-value mới
      updatedContent.push([editing.key, editing.value]);
      setNewlyAddedIndex(updatedContent.length - 1);
    }
    setFileContent(updatedContent);
    setEditing({ index: null, key: "", value: "" });
    setShowAddBox(false);
  };
  const handleDownload = () => {
    // Tạo nội dung tệp bao gồm đoạn text "# Create By MIA" và key-value
    const content =
      "# Create By MIA\n#\n" +
      fileContent.map(([key, value]) => `|${key}|${value}|`).join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const fileName = uploadedFileName.split(".")[0];
    const countryCode = countryCodes[fileName];
    const downloadFileName = countryCode
      ? countryCode
      : uploadedFileName
      ? uploadedFileName.replace(/\.[^/.]+$/, "") + ".txt"
      : "file.txt";

    // Tạo tên tệp từ tên đã upload, thay đổi phần mở rộng thành .txt

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = downloadFileName; // Sử dụng tên tệp đã upload
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleDelete = (index) => {
    if (!showAddBox) {
      // Chỉ mở hộp xóa nếu không có hộp thêm đang mở
      setDeleteIndex(index); // Hiển thị hộp thoại xác nhận với chỉ mục dòng cần xóa
    }
  };

  const confirmDelete = () => {
    const updatedContent = fileContent.filter((_, i) => i !== deleteIndex);
    setFileContent(updatedContent);
    setNewlyAddedIndex(null); // Đặt lại trạng thái chỉ mục của dòng mới thêm
    setDeleteIndex(null); // Đóng hộp thoại sau khi xóa
  };

  const cancelDelete = () => {
    setDeleteIndex(null); // Đóng hộp thoại khi người dùng hủy xóa
  };

  const handleAddCancel = () => {
    setShowAddBox(false);
    setEditing({ index: null, key: "", value: "" });
  };
  const Color = ({ color, children }) => {
    return <span style={{ color }}>{children}</span>;
  };
  const OnlyNum = (message) => {
    // Sử dụng regular expression để tìm số phiên bản dạng X.X.X (ví dụ: 0.219.14)
    const versionMatch = message.match(/(\d+\.\d+\.\d+)/);
  
    // Nếu tìm thấy thì trả về, nếu không thì trả về null
    return versionMatch ? versionMatch[0] : null;
  };
  
  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" className="hidden">
        <defs>
          <clipPath
            id="divider-1"
            clipPathUnits="objectBoundingBox"
            data-v-40d53692
          >
            <path
              transform="scale(0.000654 0.03)"
              d="m767.18 26.94 2.72-1.7-2.33-1.49-1.72 1.07-4.41 2.76-2.87 1.79-1.77-1.11-6.11-3.81-2.37 1.47 1.75 1.09 8.5 5.3 4.64-2.9 1.61-1 .01.01 2.37-1.47-.02-.01Zm3.89 2.43-3.18-1.99-2.36 1.48 5.54 3.45 1-.41 9.22-5.97-2.36-1.47-7.86 4.91ZM750 24.02l3.89-2.43 2.06 1.14 4.52 2.97 2.11.82 1.54-1.49-1.68-1.05-4.93-3.07-3.62-2.26-6.25 3.89-2.36 1.48-2.29 1.43-10.97-7.03H727l15.99 9.97 4.65-2.9.01.01 2.35-1.48Zm37.35.98-.7.45-10.24-7.27-.14.47-4.77 2.65 2.34 1.49 1.2-.76 1.23-.44 9.72 6.39.66.41 15.73-9.97h-4.42L787.35 25Zm-21.8-4.39.3 1.16 6.22 3.89 1.77 1.09 2.36-1.47-7.09-4.42-3.56-2.8-5.19 3.23 1.73 1.49 3.46-2.17Zm-9.74 6.09 2.35-1.47-2.33-1.49-2.36 1.47 2.34 1.49ZM0 14.81h734.83l9.77-6.09 2.34 1.91-9.42 5.53 9.42 5.53-2.34 1.91-9.77-6.1H0v-2.69Zm1529.38 2.69H794.8l-9.73 6.08-2.22-1.96 9.99-5.46-9.99-5.46 2.22-1.96 9.73 6.07h734.58v2.69Zm-763.83-5.79.3-1.17 6.22-3.88 1.77-1.1 2.36 1.47-7.09 4.42-3.56 2.81-5.19-3.23 1.73-1.49 3.46 2.17Zm21.8-4.4-.7-.44-10.24 7.27-.14-.47-4.77-2.65 2.34-1.49 1.2.75 1.23.44 9.72-6.39.66-.41 15.73 9.97h-4.42l-10.61-6.58ZM750 8.3l3.89 2.42 2.06-1.14 4.52-2.96 2.11-.82 1.54 1.48-1.68 1.05-4.93 3.08-3.62 2.26-6.25-3.9-2.36-1.47-2.29-1.43-10.97 7.02H727l15.99-9.97 4.65 2.9.01-.01L750 8.29v.01Zm5.81-2.68 2.35 1.47-2.33 1.48-2.36-1.46 2.34-1.49Zm11.37-.24 2.72 1.69-2.33 1.49-1.72-1.06-4.41-2.76-2.87-1.79-1.77 1.11-6.11 3.81-2.37-1.47 1.75-1.09 8.5-5.31 4.64 2.9 1.61 1h.01l2.37 1.46-.02.02Zm3.89-2.43-3.18 1.98-2.36-1.47L771.07 0l1 .42 9.22 5.96-2.36 1.47-7.86-4.9Z"
              data-v-40d53692
            ></path>
          </clipPath>
          <clipPath
            id="btn-mask"
            clipPathUnits="objectBoundingBox"
            data-v-40d53692
          >
            <path
              transform="scale(0.00525 0.0168)"
              d="m1.335-.006 36.81 1.091 9.076 2.047C53.245 2.04 60.899 1.73 60.899 1.73h14.055l30.786.446h10.039l11.837.717 24.972-1.808 19.409 1.637c7.773.578 16.731-.546 16.731-.546l-.669 26.742-2.008 3.82c1.883 3.411 2.008 5.182 2.008 5.182l-.399 3.55-.939 10.369.939 6.003h-53.59l-11.599-3.274-3.151 4.365c-8.31-1.091-14.55-1.637-14.55-1.637l-17.769 1.092-44.841.364-12.047-.722c.087-2.007-8.223-4.735-8.223-4.735l.192 3.274H.666l-.669-32.563 3.346-6.003-3.346-1.637L1.335-.006Z"
              data-v-40d53692
            ></path>
          </clipPath>
          <clipPath
            id="divider-2-left"
            clipPathUnits="objectBoundingBox"
            data-v-40d53692
          >
            <path
              transform="scale(0.00303 0.07)"
              d="M312.781.626c.097 1.495.094 2.994.08 4.49-.031.35.021.783-.302 1.014-.421.04-.139-.028-1.258-.067-.056-.677-.014-1.36-.111-2.033-.023-.372-.401-.634-.758-.593-.391.007-.866-.009-1.119.473-.148.592.062 1.356-.154 2.054-.378.351-.989.23-.639.082-1.117-1.374-1.655-2.727-2.637-3.77-1.301-1.196-3.296-2.31-5.256-2.246-.054.584-.045 1.169-.043 1.86.742.118 1.544.124 2.246.483 1.359.646 2.542 1.864 3.57 3.355-.541.313-.901.521-1.173.475-3.234.064-301.99-.005-305.225.001.051.906.051 1.203.002 1.803 3.393-.029 302.309-.015 306.296.046.24.639-.842 1.231-1.145 2.287-1.017.98-2.743 1.902-4.522 2.101a5.086 5.086 0 0 0-.015 1.548c.672.165.268.319.468.279 1.471-.129 2.91-.694 4.048-1.638 1.084-.861 2.022-2.01 2.3-3.395.141-.325.153-1.109.704-1.262.381-.012.916-.084 1.144.293.138.799-.094 1.619.082 2.418.562.033 1.138.416 1.696 0a.731.731 0 0 0 .224-.59c.006-.671-.019-1.343.059-2.013a6.063 6.063 0 0 1 1.399-.05c.164.963.059 1.938.061 2.906.017.81.027 1.621-.023 2.43-.006.334.7.892.423.876 4.337.04 8.674.003 13.01.014.285-.011.597.026.851-.139.088-.567.019-1.144-.023-1.713-.595-.099-1.198-.062-1.798-.047-3.32.003-6.639.042-9.959.023-.27.041.076-.162-.543-.455.239-.536.619-2.192.449-3.286-.19-.226-.421-.565-.152-.582.763-.053 1.533-.093 2.294.002.087.853-.054 1.84.097 2.566.518.294 1.321.924 1.694-.056.232-.02-.071-1.537.049-2.294.107-.167.295-.26.698-.272.439-.071 1.097-.059 1.742.014.198.038.136.111.183.151.12.749.235 1.527.029 2.281.064.07.19.208.253.275.487.009.976-.009 1.463-.049.213-.008.239-.285.234-.451.021-.76.766-1.523.037-2.285 1.107.008 2.223.113 3.321-.058-.038-.532.252-1.221-.179-1.64-.964-.159-1.955.007-2.925-.088-.451.236-.176-.936-.243-1.4.805-.402.16-1.042-.353-1.203-.505-.024-1.022-.046-1.522.051-.314.666-.056 1.42-.103 2.125.029.199.513.44-.317.436-.529.019-1.057-.043-1.585-.042.635-.013-.614.044-.716.489-.029-1.52.052-2.289-.028-3.053-.567.038-1.279-.192-1.748.151-.142.777-.006 1.581-.066 2.367-.861.145-1.753.16-2.606-.033.009-1.354.329-2.713.669-4.07 1.63.318 3.172-.04 5.104-.091 2.101.379 4.926.048 6.305.479.531-.929.219-1.738.211-2.305-4.556-.107-9.118-.022-13.676-.048-.386-.092.126.268-.573.619Z"
              data-v-40d53692
            ></path>
          </clipPath>
          <clipPath
            id="divider-2-right"
            clipPathUnits="objectBoundingBox"
            data-v-40d53692
          >
            <path
              transform="scale(0.00306 0.07)"
              d="M14.415 13.641c-.097-1.495-.093-2.994-.08-4.49.032-.161-.021-.784.455-1.013.268-.041.688.027 1.106.066.055.677.013 1.36.11 2.032.023.373.402 1.454.759 1.044.39-.07.955.08 1.119-.797.148-.719-.062-1.482.154-2.181.377-.35.989-.229 1.431-.081.325 1.373.862 2.727 1.844 3.769 1.301 1.476 3.296 2.311 5.256 2.247.451-.584.045-1.169.044-1.753-.743-.226-1.545-.232-2.246-.591-1.36-.645-2.543-1.862-2.886-3.354-.144-.313.919-.521.489-.475 3.233-.064 301.99.005 305.225-.001-.051-.6-.052-.483-.003-1.803-3.393.029-302.309.015-305.702-.047-.024-.638.248-1.23.551-1.774 1.017-1.492 2.743-2.415 4.522-2.209.317-.917.397-1.35.016-1.952-.088-.165-.268-.319-.468-.279-1.291.128-2.911.694-4.049 1.638-1.084.861-2.022 2.01-2.3 3.394-.042.452-.153 1.11-.704 1.262.132.013-.916.084-1.144-.292-.137-.8.095-1.619-.081-2.419-.562-.032-.473-.118-1.697 0a.736.736 0 0 0-.223.59c-.006 1.248.018 1.344-.06 2.014a6.063 6.063 0 0 1-1.399.05c-.164-.963-.058-1.937-.061-2.906-.017-.81-.026-1.621.023-2.431.006-.334.056-.89-.423-.875C9.99-.015 5.319.02.983.01 1.4.02.386-.017.132.149.044.716.113 1.292.156 2.59c.594-.629 1.197-.666 1.797-.681 3.32-.002 6.639.731 9.96-.023.269.534.571.161.542.455.067 1.093.029 2.192.046 3.286.02.883-.074.565-.343.582-.762.053-1.038.093-2.294-.003-.087-.852.055-1.722-.097-2.565-.518-.159-1.222-.222-1.694.056-.232.722.072 1.537-.049 2.293a.616.616 0 0 1-.491.273 8.882 8.882 0 0 1-1.949-.014l-.182-.151c-.12-.749.115-1.527-.029-1.948-.065-.402-.191-.541-.254-.609-.379-.008-.976.01-1.129.05-.547.007-.572 1.159-.568.45-.02.959.044 1.525-.037 2.285-1.107-.007-2.222-.113-3.32.059.037.533-.253 1.22.178 1.639.965.159 1.955-.006 2.926.089.45.321.176.936.243 1.4.049.402-.161 1.041.353 1.203.505.024 1.022.046 1.522-.051.314-.666.055-1.42.103-2.125-.029-.199.098-.441 1.1-.435-.254-.02.274.042.801.041.257.013.614-.044.716.267.03.764-.052 1.532.028 2.297.567-.038 1.279.191 1.748-.151.142-.679.006-1.581.067-2.368 1.67-.144 1.752-.159 2.605.033.09 1.355.058 2.714.025 4.071-1.928.151-3.866.04-5.24.091-2.658.062-4.764-.049-6.862.052-.532.902-.22 1.208-.212 1.775 4.556.106 9.118.02 13.676.047.386.092.63-.269.573-.619Z"
              data-v-40d53692
            ></path>
          </clipPath>
        </defs>
      </svg>
      <video autoPlay muted loop id="background-video">
        <source src="bg/campfire.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {isFileUploaded && (
        <div className="search-bar">
          <button
            className="download-btn"
            onClick={() => {
              setIsBoxVisible(!isBoxVisible);
              if (isBoxVisible && isBoxLog) setIsBoxLog(!isBoxLog)
            }}
          >
            Cập Nhật
          </button>
          {isBoxVisible && (
             <div>
              <div className="ver-box">
              {listSHA.length > 0 ? (
                <div className="log-confirmation-box">
                <div className="version-grid">
                  {listSHA.map((commit, index) => (
                    <button
                      onClick={() => {
                        setLatestSHA(commit.sha); // Lưu SHA của commit
                        fetchPatchContent(commit.sha); // Gọi hàm để lấy patch cho commit
                        setIsBoxLog(true); // Ví dụ mở box log hoặc hiển thị thông tin chi tiết
                      }}
                      key={index}  // Dùng index làm key
                    >
                      Cập Nhật: ngôn ngữ mới của Valheim {OnlyNum(commit.message)}
                      <br />
                      Ngày: {new Date(commit.date).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              ) : (
                <p>Vui lòng Đợi..</p>
              )}
           </div>
             </div>
          )}
          {isBoxLog && (
            <div className="log-box">
              <PatchViewer patch={patchContent} />
            </div>
          )}
          <button
            className="add-btn"
            onClick={() => {
              if (deleteIndex === null) setShowAddBox(true); // Chỉ mở hộp thêm nếu hộp xóa không mở
            }}
          >
            Thêm
          </button>
          <button className="download-btn" onClick={handleDownload}>
            Tải về
          </button>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}
      {isFileUploaded && (
        <div className="key-value-container">
          <table className="key-value-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map((line, index) => (
                <tr
                  key={index}
                  className={index === newlyAddedIndex ? "new-item" : ""}
                >
                  <td onClick={() => handleEditClick(index, line[0], line[1])}>
                    {line[0]}
                  </td>
                  <td onClick={() => handleEditClick(index, line[0], line[1])}>
                    {line[1]}
                  </td>
                  <td>
                    <button onClick={() => handleDelete(index)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!isFileUploaded && (
        <>
          {/* Tiêu đề chính */}
          <div className="img-title">
            <h1>Valheim Language Mod</h1>
            <div className="section-divider h-8"></div>
            <div className="game-platforms flex items-center justify-center gap-4 absolute left-0 bottom-5 md:bottom-10 xl:bottom-28 w-full">
              <div className="section-hero .game-platforms:before"> </div>
            </div>
          </div>
          {/* Khung About the Mod */}
          <div className="about-container">
            {/* Khung riêng biệt cho About the Mod */}
            <div className="about-title">
              <p className="text text-white uppercase font-secondary text-base tracking-widest">
                Hưỡng dẫn & Lưu ý
              </p>
            </div>
            {/* Khung văn bản nằm dưới */}
            <div className="text-box">
              <p className="text-content">
                Công cụ này giúp bạn chỉnh sửa, thêm mới Các dòng Text trực tiếp
                vào tệp thay vì dùng các phần mềm bên thứ ba
                <br />
                <br />
                Để lấy tệp cũng như áp dụng việt hóa, Truy cập vào thư mục game
                theo đường dẫn:{" "}
                <Color color="yellow">Valheim\BepInEx\language</Color>
                <br />
                Tại đây sẽ có 2 lưu ý:
                <br />+ Đối với Ngôn ngữ Tiếng Việt, tệp sẽ có tên{" "}
                <Color color="orange">vi.txt</Color>
                <br />+ Đối với ngôn ngữ khác, Các tệp sẽ nằm trong thự mục{" "}
                <Color color="orange">other</Color>
                <br />
                <br />
                Sau khi đã Chỉnh sửa tệp, vui lòng dán, thay thế tệp vào đường
                dẫn vừa lấy và khởi động lại game để áp dụng Mod
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-stretch justify-center gap-3 pointer-events-auto">
            <button className="btn btn--primary" onClick={triggerFileInput}>
              <span className="btn-text">UPLOAD</span>
            </button>
            <button
              className="btn btn--primary"
              onClick={() => setShowLanguageBox(!showLanguageBox)}
            >
              <span className="btn-text">Mẫu Ngôn ngữ</span>
            </button>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            {/* Hộp dropdown danh sách ngôn ngữ */}
            {showLanguageBox && (
              <div className="confirmation-box">
                <p>Chọn mẫu ngôn ngữ có sẵn Của Game</p>
                <button onClick={() => setListLanguage(!ListLanguage)}>
                  Chọn ngôn ngữ
                </button>
                {ListLanguage && (
                  <div className="language-box">
                    {languages.length > 0 ? (
                      <div className="language-grid">
                        {languages.map((language, index) => (
                          <button
                            key={index}
                            value={language}
                            onClick={handleLanguageSelect}
                            className="language-button"
                          >
                            {language}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p>Đang tải danh sách ngôn ngữ...</p>
                    )}
                  </div>
                )}
                {ListLanguage && (
                  <div>
                    <br></br>
                    <button onClick={handleFetchTranslation}>Xác nhận</button>
                    <button
                      onClick={() => {
                        setShowLanguageBox(false);
                        setListLanguage(false);
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {deleteIndex !== null && (
        <div className="confirmation-box">
          <p>Bạn có chắc chắn muốn xóa không?</p>
          <button onClick={confirmDelete}>Có</button>
          <button onClick={cancelDelete}>Không</button>
        </div>
      )}

      {showAddBox && (
        <div className="edit-box">
          <input
            type="text"
            placeholder="Key"
            value={editing.key}
            onChange={(e) =>
              setEditing((prev) => ({ ...prev, key: e.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Value"
            value={editing.value}
            onChange={(e) =>
              setEditing((prev) => ({ ...prev, value: e.target.value }))
            }
          />
          <button onClick={handleAddSave}>
            {editing.index !== null ? "Lưu" : "Thêm"}
          </button>
          <button onClick={handleAddCancel}>Hủy</button>
        </div>
      )}
    </>
  );
}

export default Edit;
