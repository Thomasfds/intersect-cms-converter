// preload.js

const {
    time
} = require('console');

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const electron = require('electron');
    const fs = require('fs');
    const path = require('path');
    const remote = require('electron').remote;
    const shell = require('electron').shell;
    const {
        ipcRenderer
    } = require('electron');

    const directoryPath = path.join(__dirname, '/convertItems/');
    const listFiles = document.querySelector("#list");
    const scanButton = document.querySelector("#scan");
    const resetButton = document.querySelector("#reset");
    const convertButton = document.querySelector("#convert");
    const openButton = document.querySelector("#openFolder");
    const notification = document.getElementById('notification');
    const message = document.getElementById('message');
    const restartButton = document.getElementById('restart-button');
    const closeButton = document.querySelector("#close-button");
    const uploadButton = document.querySelector("#upload");

    let files = [];

    if (!fs.existsSync('./convertItems/')) {
        fs.mkdirSync('./convertItems/', {
            recursive: true
        })
    }


    // dialog.showErrorBox("test", "test")


    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }

    if (scanButton != null) {
        scanButton.addEventListener('click', async () => {
            desactivateButton();
            openButton.classList.add("is-hidden");
            listFiles.innerHTML = `<a class="panel-block border-bottom border-rounded-0">
                    <progress class="progress is-small is-primary" max="100">15%</progress>
                </a>`;

            let readDir = readDirectoryFunction();

            readDir.then(e => {
                arr = e.filter(function (item) {
                    return item !== "converted"
                })

                arr = arr.filter((item) => {
                    return check(item);
                })

                return files = arr;
            }).finally(() => {

                setTimeout(() => {
                    console.log(files.length)
                    console.log()
                    if (files.length > 1 && files.length <= 2000) {
                        convertButton.classList.remove("is-hidden")
                        listFiles.innerHTML = "";
                        files.forEach(element => {
                            if (check(element)) {
                                let html =
                                    `<a class="panel-block border-bottom border-rounded-0">
                                ${element}
                            </a>`;
                                listFiles.innerHTML += html;
                                activateButton();
                            }

                        });
                    } else {
                        if (files.length < 1) {
                            let html =
                                `<a class="panel-block border-bottom border-rounded-0">
                                No files
                            </a>`;
                            listFiles.innerHTML = html;
                            activateButton();
                        } else {
                            let html =
                                `<a class="panel-block border-bottom border-rounded-0">
                                Too many files, the files limit is <strong>&nbsp;2000</strong>.
                            </a>`;
                            listFiles.innerHTML = html;
                            activateButton();
                        }

                    }

                }, 1000);
            })
        })
    }

    if (resetButton != null) {
        resetButton.addEventListener('click', () => {
            listFiles.innerHTML = `<a class="panel-block border-bottom border-rounded-0">
                    Deleting files in progress...
                </a>`;
            convertButton.classList.add("is-hidden");
            openButton.classList.add("is-hidden");
            uploadButton.classList.remove("is-hidden");
            uploadButton.value = "";
            uploadButton.disabled = false;

            fs.rmdirSync(directoryPath, {
                recursive: true
            });

            setInterval(() => {
                listFiles.innerHTML = `<a class="panel-block border-bottom border-rounded-0">
                    No files
                </a>`;
                fs.mkdirSync('./convertItems/', {
                    recursive: true
                })
            }, 10000);
        });
    }

    if (convertButton != null) {
        convertButton.addEventListener('click', async () => {
            if (files.length >= 1) {
                files.forEach(element => {
                    const oldPath = path.join(__dirname + "/convertItems/", element)
                    const newPath = path.join(__dirname + "/convertItems/converted/", element.toLowerCase())
                    renameFiles(oldPath, newPath)
                })
            } else {
                listFiles.innerHTML = `<a class="panel-block border-bottom border-rounded-0">
                    No files
                </a>`;
                listFiles.innerHTML = `<a class="panel-block border-bottom border-rounded-0">
                    No files
                </a>`;
                convertButton.classList.add("is-hidden")
            }
        });
    }

    if (openButton != null) {
        openButton.addEventListener('click', (e) => {
            shell.openPath(directoryPath + "/converted/");
        })
    }

    if (restartButton != null) {
        restartButton.addEventListener('click', restartApp)
    }

    if (closeButton != null) {
        closeButton.addEventListener('click', closeNotification)
    }

    if (uploadButton != null) {
        uploadButton.addEventListener('change', (evt) => {
            let files = evt.target.files; // FileList object
            console.log("Images", files)
            let x = [];
            x = Object.values(files);
            console.log('x', x)
            let timeWaiting = 0;

            if (x.length < 500) {
                timeWaiting = 300;
            }

            if (x) {
                x.forEach(element => {
                    fs.createReadStream(element.path).pipe(fs.createWriteStream(directoryPath + element.name));
                    setTimeout(() => {
                        listFiles.innerHTML = `<a class="panel-block border-bottom border-rounded-0">
                     All files are uploaded.
               </a>`;
                        uploadButton.disabled = true;
                        scanButton.disabled = false;
                        uploadButton.classList.add('is-hidden')
                    }, timeWaiting);
                })
            }


        });

    }

    async function readDirectoryFunction() {
        return await fs.promises.readdir(directoryPath);
    }

    async function renameFiles(oldPath, newPath) {
        desactivateButton();
        if (!fs.existsSync('./convertItems/converted/')) {
            fs.mkdirSync('./convertItems/converted/', {
                recursive: true
            })
        }

        let rename = fs.promises.rename(oldPath, newPath);
        rename.then((e) => {
            console.log(e)
            if (e) {
                console.log('erreur')
            } else {
                listFiles.innerHTML = `<a class="panel-block border-bottom border-rounded-0">
                    Waiting...
               </a>`;

                let timeWaiting = 0;

                if (files.length <= 1000) {
                    timeWaiting = 20000;
                }

                if (files.length <= 1500) {
                    timeWaiting = 25000;
                }

                if (files.length < 1600) {
                    timeWaiting = 30000;
                }

                setTimeout(() => {
                    listFiles.innerHTML = `<a class="panel-block border-bottom border-rounded-0">
                     All files are converted.
               </a>`;
                    convertButton.classList.add("is-hidden")
                    openButton.classList.remove("is-hidden")
                    activateButton();
                }, timeWaiting);
            }

        })
    }

    function check(string) {
        var i = 0;
        var character = '';
        while (i <= string.length) {
            character = string.charAt(i);
            if (character == character.toUpperCase()) {
                return true;
            } else {
                return false;
            }
            i++;
        }
    }

    function desactivateButton() {
        scanButton.disabled = true;
        convertButton.disabled = true;
        resetButton.disabled = true;
    }

    function activateButton() {
        scanButton.disabled = false;
        convertButton.disabled = false;
        resetButton.disabled = false;
    }

    ipcRenderer.on('update_available', () => {
        ipcRenderer.removeAllListeners('update_available');
        message.innerText = 'A new update is available. Downloading now...';
        notification.classList.remove('hidden');
    });
    ipcRenderer.on('update_downloaded', () => {
        ipcRenderer.removeAllListeners('update_downloaded');
        message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
        restartButton.classList.remove('hidden');
        notification.classList.remove('hidden');
    });

    function closeNotification() {
        notification.classList.add('hidden');
    }

    function restartApp() {
        ipcRenderer.send('restart_app');
    }
})