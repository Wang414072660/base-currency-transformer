//@ts-nocheck
import { bitable, UIBuilder, FieldType, ITable, IRecord } from "@lark-base-open/js-sdk";

export default async function main(uiBuilder: UIBuilder, { t }) {

    const currencies = [
        { label: t('RMB'), value: '￥' },
        { label: t('USD'), value: '$' },
        { label: t('EUR'), value: '€' },
        { label: t('JPY'), value: '¥' },
        { label: t('GBP'), value: '£' },
        // 可以根据需要添加其他货币
      ];

      const units = [
        { label: t('K_thousand'), value: 0 },
        { label: t('M_ten_thousand'), value: 1 },
        { label: t('T_hundred_thousand'), value: 2 },
        { label: t('B_million'), value: 3 },
        { label: t('T_million'), value: 4 },
        { label: t('B_billion'), value: 5 },
        { label: t('T_billion'), value: 6 },
        { label: t('H_billion'), value: 7 },
        { label: t('Q_billion'), value: 8 },
        { label: t('T_trillion'), value: 9 },
    ];

    uiBuilder.form((form) => ({
        formItems: [
            form.tableSelect('table', { label: t('table') }),
            form.fieldSelect('targetField', { label: t('targetField'), sourceTable: 'table', filterByTypes: [FieldType.Number] }),
            form.fieldSelect('ouputField', { label: t('outputField'), sourceTable: 'table', filter: ({ type }) => type === FieldType.Text }),
            form.select('currency', { label: t('currency'), options: currencies, defaultValue: '￥' }),
            form.select('unit', { label: t('unit'), options: units, defaultValue: 1 }),
        ],
        buttons: [t('convert')],
    }), async ({ key, values }) => {
        const { table, targetField, ouputField, currency, unit } = values;
        // console.log("table: ", table);
        // console.log("tableid: ", table.id);
        // console.log("target: ", target);
        // console.log("ouputField: ", ouputField);
        // await convert();
        await handleData(table, targetField, ouputField, currency, unit);
    });

    
    const handleData = async (table: ITable, targetField: any, ouputField: any, currency: string, unit: number) => {
        const { records } = await table.getRecords({
            pageSize: 5000
        });
        // console.log("records:", records);
        // console.log("targetField:", targetField);
        // console.log("ouputField:", ouputField);
        // console.log("currency:", currency);
        // console.log("unit:", unit);

        await asyncForEach(records, async (record) => {
            // console.log("record:", record);
            // console.log("targetField:", targetField);
            // console.log("record.fields:", record.fields[targetField.id]);
            if (!record.fields[targetField.id]) {
                // 这一行没有date值
                return;
            }
            // console.log("record.fields:", record.fields[targetField.id]);
            const fielddata = record.fields[targetField.id];
            // console.log("fielddata:", fielddata);
            const formattedText = transformData(fielddata, currency, unit);
            console.log("formattedText:", formattedText);
            record.fields[ouputField.id] = [{
                type: 'text',
                text: formattedText,
            }];
        });
        table.setRecords(records);
        console.log("处理后records:", records);
    }

    const asyncForEach = (array: any[], callback: (item: any) => Promise<void>): Promise<void> => {
        let completedCount = 0; // 计数器，用于跟踪已完成的异步任务数量

        return new Promise((resolve) => {
            array.forEach(async (item) => {
                // console.log("asyncForEach.forEach.item:", item);
                await callback(item);
                completedCount++;

                if (completedCount === array.length) {
                    resolve();
                }
            });
        });
    };

    const transformData = (fielddata: number, currency: string, unit: number) => {
        // const unitsLabels = ['千', '万', '十万', '百万', '千万', '亿', '十亿', '百亿', '千亿', '兆'];
        // const unitLabel = unitsLabels[unit];
        const unitLabel = units.find(u => u.value === unit)?.label || '';
    
        const transformedValue = fielddata / Math.pow(10, (unit + 3)); // 单位转换
        
        const formattedValue = transformedValue.toLocaleString(undefined, { maximumFractionDigits: 20 }); // 设置最大小数位数为20
        return `${currency} ${formattedValue}${unitLabel}`;
    };


    const convert = async () => {
        // Get the current TableMetaList
        const tableMetaList = await bitable.base.getTableMetaList();
        uiBuilder.markdown(`tableMetaList:当前选择的对象是：\n\`\`\`json\n${JSON.stringify(tableMetaList, null, 2)}\n\`\`\``);

        // Get the current selection
        const selection = await bitable.base.getSelection();
        uiBuilder.markdown(`selection:当前选择的对象是：\n\`\`\`json\n${JSON.stringify(selection, null, 2)}\n\`\`\``);
        // Find current table by tableId
        const table = await bitable.base.getTableById(selection?.tableId!);
        uiBuilder.markdown(`table:当前选择的对象是：\n\`\`\`json\n${JSON.stringify(table, null, 2)}\n\`\`\``);
        // Get table's field meta list
        const fieldMetaList = await table.getFieldMetaList();
        uiBuilder.markdown(`fieldMetaList:当前选择的对象是：\n\`\`\`json\n${JSON.stringify(fieldMetaList, null, 2)}\n\`\`\``);
        // Find the field with the same name as Multiline or 多行文本
        const textField = fieldMetaList.find(({ name }) => name === 'Multiline' || name === '多行文本');


    }
}