/**
 * Import JSON data into form
 * @param {Object} jsonData - The imported JSON data
 * @param {Object} form - The form ref to populate
 * @returns {Object} - { success: boolean, error?: string }
 */
export function importFromJson(jsonData, form) {
    try {
        // Map meta info
        if (jsonData.meta) {
            if (jsonData.meta.eye) {
                form.eye = jsonData.meta.eye;
            }
        }

        // Map eye information
        if (jsonData.eyeInfo) {
            const eyeFields = [
                'noteSistemic', 'noteEye', 'offsetLimbus', 'offsetPupilla',
                'SDP', 'SRI', 'SAI', 'AbS', 'Coma', 'HOA',
                'pupillaPhotopic', 'pupillaMesopica', 'pupillaScotopic', 'cellEndotelio'
            ];
            eyeFields.forEach(field => {
                if (jsonData.eyeInfo[field] !== undefined) {
                    form[field] = String(jsonData.eyeInfo[field]);
                }
            });
        }

        // Map CSO machine data
        if (jsonData.machineData && jsonData.machineData.cso) {
            const csoData = jsonData.machineData.cso;
            const csoFields = ['K1', 'axK1', 'K2', 'axK2', 'avgKm', 'cil', 'ax', 'AXL', 'ACD', 'LT'];
            csoFields.forEach(field => {
                if (csoData[field] !== undefined) {
                    form[`cso_${field}`] = String(csoData[field]);
                }
            });
            // Also map cilTotal and axTotal if present
            if (csoData.cilTotal !== undefined) form.cilTotal = String(csoData.cilTotal);
            if (csoData.axTotal !== undefined) form.axConclusion = String(csoData.axTotal);
        }

        console.log('JSON data imported successfully');
        return { success: true };
    } catch (err) {
        console.error('Error importing JSON data:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Export operation data as JSON file
 * @param {Object} form - The form data
 * @param {Array} patients - List of patients
 */
export function exportAsJson(form, patients) {
    // Find patient name
    const patient = patients.find(p => p.id === form.patientId);
    const patientName = patient ? patient.name : 'unknown';
    const dateStr = form.operationDate || new Date().toISOString().split('T')[0];
    
    const exportData = {
        meta: {
            exportDate: new Date().toISOString(),
            patientName: patientName,
            examDate: dateStr,
            eye: form.eye,
            version: '1.0'
        },
        ocularParams: {
            offsetLimbus: form.offsetLimbus,
            offsetPupilla: form.offsetPupilla,
            AbS: form.AbS,
            Coma: form.Coma,
            HOA: form.HOA,
            SDP: form.SDP,
            SRI: form.SRI,
            SAI: form.SAI,
            pupillaPhotopic: form.pupillaPhotopic,
            pupillaMesopica: form.pupillaMesopica,
            pupillaScotopic: form.pupillaScotopic,
            cellEndotelio: form.cellEndotelio
        },
        keratometry: {
            K1: form.cso_K1,
            axK1: form.cso_axK1,
            K2: form.cso_K2,
            axK2: form.cso_axK2,
            avgKm: form.cso_avgKm,
            cil: form.cso_cil,
            ax: form.cso_ax,
            cilTotal: form.cilTotal,
            axConclusion: form.axConclusion
        },
        biometry: {
            AXL: form.cso_AXL,
            ACD: form.cso_ACD,
            LT: form.cso_LT
        },
        bcdva: {
            sph: form.bcdva_sph,
            cyl: form.bcdva_cyl,
            ax: form.bcdva_ax,
            va: form.bcdva_va
        },
        notes: {
            systemic: form.noteSistemic,
            ocular: form.noteEye,
            general: form.noteIOLType
        }
    };
    
    const filename = `operation-${patientName.replace(/\s+/g, '_')}-${dateStr}.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Print current view using system print dialog
 * Uses Electron's print API with fallback to window.print()
 */
export async function printAsPdf() {
    try {
        await window.api.print.preview();
    } catch (error) {
        console.error('Print failed:', error);
        // Fallback to window.print() if Electron print fails
        window.print();
    }
}
