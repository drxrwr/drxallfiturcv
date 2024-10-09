function convertTxtToVcf() {
    const fileInput = document.getElementById('txt-file');
    const contactName = document.getElementById('contact-name').value;
    const vcfFileName = document.getElementById('vcf-file-name').value;
    const contactCount = parseInt(document.getElementById('contact-count').value, 10);
    const startNumber = parseInt(document.getElementById('start-number').value, 10); // Ambil nomor awal
    const fileInfo = document.getElementById('file-info');

    if (fileInput.files.length === 0) {
        alert('Silakan pilih file TXT terlebih dahulu.');
        return;
    }
    if (!contactName || !vcfFileName || isNaN(contactCount) || contactCount <= 0 || isNaN(startNumber)) {
        alert('Silakan masukkan nama kontak, nama file VCF, jumlah kontak per file, dan nomor awal yang valid.');
        return;
    }

    const files = fileInput.files;
    let allContacts = [];
    let filesRead = 0;

    const readFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function(event) {
                const lines = event.target.result.split('\n').filter(line => line.trim() !== '');
                lines.forEach(line => {
                    const contactNumber = line.trim().replace(/[^0-9]/g, '');
                    const formattedNumber = contactNumber.startsWith('+') ? contactNumber : `+${contactNumber}`;
                    allContacts.push(formattedNumber);
                });
                filesRead++;
                resolve();
            };

            reader.onerror = function(error) {
                reject('Terjadi kesalahan saat membaca file:', error);
            };

            reader.readAsText(file);
        });
    };

    const processFiles = async () => {
        try {
            for (const file of files) {
                await readFile(file);
            }

            if (allContacts.length === 0) {
                fileInfo.textContent = 'Tidak ada kontak ditemukan dalam file.';
                return;
            }

            const totalFiles = Math.ceil(allContacts.length / contactCount);
            fileInfo.textContent = `Total file VCF yang akan diunduh: ${totalFiles}`;

            let fileIndex = startNumber; // Mulai dengan nomor awal
            for (let i = 0; i < totalFiles; i++) {
                const startIndex = i * contactCount;
                const endIndex = Math.min(startIndex + contactCount, allContacts.length);
                const contactsChunk = allContacts.slice(startIndex, endIndex);
                let vcfFileContent = '';

                contactsChunk.forEach((contact, index) => {
                    vcfFileContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName} ${startIndex + index + 1}\nTEL:${contact}\nEND:VCARD\n`;
                });

                // Gunakan setTimeout untuk memastikan unduhan file tidak tumpang tindih
                await new Promise(resolve => setTimeout(resolve, 100)); // Delay 100ms untuk setiap file

                const vcfBlob = new Blob([vcfFileContent], { type: 'text/vcard' });
                const vcfUrl = URL.createObjectURL(vcfBlob);
                const link = document.createElement('a');
                link.href = vcfUrl;
                link.download = `${vcfFileName}_${fileIndex++}.vcf`; // Gunakan nomor awal dan increment
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(vcfUrl);

                console.log(`Downloaded file: ${vcfFileName}_${fileIndex - 1}.vcf`);
            }

            fileInfo.textContent = 'Konversi selesai. Semua file VCF telah diunduh.';
        } catch (error) {
            console.error(error);
            fileInfo.textContent = 'Terjadi kesalahan saat konversi.';
        }
    };

    processFiles();
}





// Fungsi untuk menggabungkan file TXT
async function mergeTxtFiles() {
    const fileInput = document.getElementById('merge-files');
    const mergedFileName = document.getElementById('merged-file-name').value;
    const mergeFileInfo = document.getElementById('merge-file-info');

    if (fileInput.files.length === 0) {
        alert('Silakan pilih file TXT terlebih dahulu.');
        return;
    }
    if (!mergedFileName) {
        alert('Silakan masukkan nama file gabungan.');
        return;
    }

    let mergedContent = '';
    const files = Array.from(fileInput.files);

    for (const file of files) {
        const content = await readFileAsync(file);
        mergedContent += content + '\n';
    }

    const mergedBlob = new Blob([mergedContent], { type: 'text/plain' });
    const mergedUrl = URL.createObjectURL(mergedBlob);
    const link = document.createElement('a');
    link.href = mergedUrl;
    link.download = `${mergedFileName}.txt`;
    link.click();
    URL.revokeObjectURL(mergedUrl);
    mergeFileInfo.textContent = 'Penggabungan selesai.';
}

function readFileAsync(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        reader.onerror = function(error) {
            reject(error);
        };
        reader.readAsText(file);
    });
}




// Fungsi untuk mengonversi VCF ke TXT
// Fungsi untuk mengonversi VCF ke TXT
function convertVcfToTxt() {
    const fileInput = document.getElementById('vcf-files');
    const txtFileName = document.getElementById('txt-file-name').value;
    const combineFiles = document.getElementById('combine-files').checked; // Menambahkan opsi gabung atau tidak
    const vcfToTxtInfo = document.getElementById('vcf-to-txt-info');

    if (fileInput.files.length === 0) {
        alert('Silakan pilih file VCF terlebih dahulu.');
        return;
    }
    if (!txtFileName) {
        alert('Silakan masukkan nama file TXT.');
        return;
    }

    const files = Array.from(fileInput.files); // Ubah ke array untuk memastikan urutan
    let allContacts = [];

    // Fungsi untuk membaca file VCF dan mengembalikan isi sebagai string
    const readFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                resolve(event.target.result);
            };
            reader.onerror = function(error) {
                console.error('Terjadi kesalahan saat membaca file:', error);
                reject(error);
                vcfToTxtInfo.textContent = 'Terjadi kesalahan saat konversi.';
            };
            reader.readAsText(file);
        });
    };

    // Fungsi untuk memproses konten file dan mengambil nomor telepon
    const processFileContent = (fileContent) => {
        // Pisahkan setiap vCard berdasarkan pola BEGIN:VCARD dan END:VCARD
        const vcardArray = fileContent.split(/END:VCARD\s*/).filter(vcard => vcard.trim() !== '');

        // Ekstrak nomor telepon dari setiap vCard
        const contacts = vcardArray.map(vcard => {
            const telMatch = vcard.match(/TEL:\+?(\d+)/);
            return telMatch ? telMatch[1] : '';
        }).filter(tel => tel !== '');

        return contacts;
    };

    // Fungsi utama untuk memproses semua file secara berurutan untuk menjaga urutan
    const processFilesSequentially = async () => {
        for (const file of files) {
            try {
                const content = await readFile(file);
                const contacts = processFileContent(content);
                allContacts = allContacts.concat(contacts); // Gabung sambil menjaga urutan
            } catch (error) {
                console.error('Terjadi kesalahan saat membaca file:', error);
                return;
            }
        }

        // Setelah semua file diproses, lanjutkan ke pengunduhan
        if (combineFiles) {
            // Gabungkan semua nomor telepon menjadi satu file TXT
            const txtBlob = new Blob([allContacts.join('\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(txtBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${txtFileName}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            vcfToTxtInfo.textContent = 'Konversi selesai. File TXT gabungan telah diunduh.';
        } else {
            // Jika opsi gabung tidak dipilih, buat file TXT terpisah untuk setiap nomor
            allContacts.forEach((contact, index) => {
                const txtBlob = new Blob([contact], { type: 'text/plain' });
                const url = URL.createObjectURL(txtBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${txtFileName}_${index + 1}.txt`;
                link.click();
                URL.revokeObjectURL(url);
            });
            vcfToTxtInfo.textContent = 'Konversi selesai. Semua file TXT telah diunduh.';
        }
    };

    // Memulai proses pemrosesan file secara berurutan
    processFilesSequentially();
}


// Fungsi untuk membagi file VCF
function splitVcfFile() {
    const fileInput = document.getElementById('vcf-file');
    const splitFileName = document.getElementById('split-file-name').value;
    const contactsPerFile = parseInt(document.getElementById('contacts-per-file').value, 10);
    const vcfSplitInfo = document.getElementById('vcf-split-info');

    if (fileInput.files.length === 0) {
        alert('Silakan pilih file VCF terlebih dahulu.');
        return;
    }
    if (!splitFileName || isNaN(contactsPerFile) || contactsPerFile <= 0) {
        alert('Silakan masukkan nama file dan jumlah kontak per file yang valid.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const vcfData = event.target.result;
        const vcardArray = vcfData.split(/(?=BEGIN:VCARD)/).filter(vcard => vcard.trim() !== '');

        let fileCount = 0;

        while (vcardArray.length > 0) {
            const splitData = vcardArray.splice(0, contactsPerFile).join('\n') + 'END:VCARD\n';
            const vcfBlob = new Blob([splitData], { type: 'text/vcard' });
            const vcfUrl = URL.createObjectURL(vcfBlob);

            // Membuat link download
            const link = document.createElement('a');
            link.href = vcfUrl;
            link.download = `${splitFileName}_${fileCount + 1}.vcf`;
            link.style.display = 'none'; // Menyembunyikan link

            // Menambahkan link ke dokumen
            document.body.appendChild(link);

            // Trigger klik pada link untuk mengunduh secara otomatis
            link.click();

            // Menghapus link setelah diunduh
            document.body.removeChild(link);

            fileCount++;
        }

        // Menampilkan informasi jumlah file yang diunduh
        vcfSplitInfo.textContent = `Pembagian file selesai. Total ${fileCount} file VCF telah diunduh.`;
    };

    reader.onerror = function(error) {
        console.error('Terjadi kesalahan saat membaca file:', error);
        vcfSplitInfo.textContent = 'Terjadi kesalahan saat pembagian.';
    };

    reader.readAsText(file);
}


 
// GANTI NAMA KONTAK

// Fungsi untuk mengganti nama kontak di VCF
function editVcfContactName() {
    const fileInput = document.getElementById('vcf-edit-file');
    const newContactName = document.getElementById('new-contact-name').value;
    const editFileName = document.getElementById('edit-file-name').value;
    const vcfEditInfo = document.getElementById('vcf-edit-info');

    if (fileInput.files.length === 0) {
        alert('Silakan pilih file VCF terlebih dahulu.');
        return;
    }
    if (!newContactName || !editFileName) {
        alert('Silakan masukkan nama kontak baru dan nama file VCF.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        let vcfContent = event.target.result;
        
        // Pisahkan setiap vCard berdasarkan pola BEGIN:VCARD dan END:VCARD
        const vcardArray = vcfContent.split(/END:VCARD\s*/).filter(vcard => vcard.trim() !== '');

        // Proses mengganti nama setiap kontak dengan urutan nomor
        let updatedVcfContent = vcardArray.map((vcard, index) => {
            // Mengganti pola 'FN:...' dengan nama baru yang diikuti nomor urut
            return vcard.replace(/FN:[^\n]*/g, `FN:${newContactName} ${index + 1}`);
        }).join('END:VCARD\n'); // Menyusun kembali menjadi format VCF

        const editedBlob = new Blob([updatedVcfContent], { type: 'text/vcard' });
        const editedUrl = URL.createObjectURL(editedBlob);
        const link = document.createElement('a');
        link.href = editedUrl;
        link.download = `${editFileName}.vcf`;
        link.click();
        URL.revokeObjectURL(editedUrl);
        vcfEditInfo.textContent = 'Penggantian nama selesai.';
    };

    reader.readAsText(file);
}
