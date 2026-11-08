package model;

import exception.ValidationException;
import filemanager.enums.FileCategory;
import filemanager.enums.FileOrigin;
import filemanager.model.ManagedFile;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ManagedFileTest {

    @Test
    void createValidImageFileShouldClassifyAsImageAndProvideTargets() {
        ManagedFile file = ManagedFile.create(
                "recibo.png",
                "uuid-123.png",
                "png",
                "image/png",
                FileOrigin.UPLOADED,
                20480L,
                null,
                800,
                600,
                null
        );

        assertEquals("recibo.png", file.getOriginalName());
        assertEquals("png", file.getExtension());
        assertEquals(FileCategory.IMAGE, file.getCategory());
        assertTrue(file.getAvailableTargets().contains("pdf"));
        assertTrue(file.getAvailableTargets().contains("jpg"));
        assertFalse(file.getAvailableTargets().contains("png"));
    }

    @Test
    void createWithBlankNameShouldThrowValidationException() {
        assertThrows(ValidationException.class, () -> ManagedFile.create(
                "   ",
                "uuid-123.pdf",
                "pdf",
                "application/pdf",
                FileOrigin.UPLOADED,
                1024L,
                2,
                null,
                null,
                null
        ));
    }

    @Test
    void renameShouldAppendExtensionAutomatically() {
        ManagedFile file = ManagedFile.create(
                "original.pdf",
                "uuid-999.pdf",
                "pdf",
                "application/pdf",
                FileOrigin.UPLOADED,
                5000L,
                4,
                null,
                null,
                null
        );

        file.rename("Contrato_Firmado");
        assertEquals("Contrato_Firmado.pdf", file.getOriginalName());
    }
}
