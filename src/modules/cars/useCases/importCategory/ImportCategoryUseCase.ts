import { parse } from "csv-parse";
import fs from "fs";

import { ICategoriesRepository } from "../../repositories/ICategoriesRepository";

interface IImportCategory {
    name: string;
    description: string;
}

class ImportCategoryUseCase {
    constructor(private categoriesRepository: ICategoriesRepository) {}

    loadCategories(file: Express.Multer.File): Promise<IImportCategory[]> {
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(file.path); // read by chunks the file
            const categories: IImportCategory[] = [];

            const parseFile = parse();

            stream.pipe(parseFile);
            // 'pipe' put the chunk in other file per exemple

            parseFile
                .on("data", async (line) => {
                    // line returns ["name", "description"]
                    const [name, description] = line;
                    categories.push({
                        name,
                        description,
                    });
                })
                // read line by line
                .on("end", () => {
                    fs.promises.unlink(file.path); // remove o arquivo
                    resolve(categories); // when all parse have finished put into resolve, categories
                })
                .on("error", (err) => {
                    reject(err); // if we have a error put into reject
                });
        });
    }

    async execute(file: Express.Multer.File): Promise<void> {
        const categories = await this.loadCategories(file);

        categories.map(async (category) => {
            const { name, description } = category;

            const existCategory = this.categoriesRepository.findByName(name);

            if (!existCategory) {
                this.categoriesRepository.create({
                    name,
                    description,
                });
            }
        });
    }
}

export { ImportCategoryUseCase };
