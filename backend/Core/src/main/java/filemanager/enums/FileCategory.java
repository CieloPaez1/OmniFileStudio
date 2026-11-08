package filemanager.enums;

import java.util.List;

public enum FileCategory {
    IMAGE,
    PDF,
    DATA,
    DOCUMENT,
    ARCHIVE,
    OTHER;

    public static FileCategory fromExtension(String ext) {
        if (ext == null) return OTHER;
        String clean = ext.toLowerCase().replace(".", "").trim();
        return switch (clean) {
            case "jpg", "jpeg", "png", "gif", "bmp", "webp" -> IMAGE;
            case "pdf" -> PDF;
            case "csv", "json", "tsv" -> DATA;
            case "txt", "md", "html", "htm" -> DOCUMENT;
            case "zip" -> ARCHIVE;
            default -> OTHER;
        };
    }

    public static List<String> getAvailableTargets(String ext) {
        if (ext == null) return List.of("pdf", "txt");
        String clean = ext.toLowerCase().replace(".", "").trim();
        FileCategory cat = fromExtension(clean);

        return switch (cat) {
            case IMAGE -> List.of("pdf", "png", "jpg", "bmp", "gif").stream()
                    .filter(f -> !f.equals(clean) && !(clean.equals("jpeg") && f.equals("jpg")))
                    .toList();
            case DATA -> List.of("pdf", "csv", "json", "html", "txt").stream()
                    .filter(f -> !f.equals(clean))
                    .toList();
            case DOCUMENT -> List.of("pdf", "html", "txt", "md").stream()
                    .filter(f -> !f.equals(clean))
                    .toList();
            case PDF -> List.of("txt", "html");
            default -> List.of("pdf", "txt");
        };
    }
}
