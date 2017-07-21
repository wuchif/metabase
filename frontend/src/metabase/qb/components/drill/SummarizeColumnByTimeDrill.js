/* @flow */

import React from "react";

import StructuredQuery from "metabase-lib/lib/queries/StructuredQuery";
import { getFieldRefFromColumn } from "metabase/qb/lib/actions";
import { isNumeric, isDate, getAggregator, isCompatibleAggregatorForField } from "metabase/lib/schema_metadata";
import { capitalize } from "metabase/lib/formatting";

import type {
    ClickAction,
    ClickActionProps
} from "metabase/meta/types/Visualization";

export default ({ question, clicked }: ClickActionProps): ClickAction[] => {
    const query = question.query();
    if (!(query instanceof StructuredQuery)) {
        return [];
    }

    const dateField = query.table().fields.filter(isDate)[0];
    if (
        !dateField ||
        !clicked ||
        !clicked.column ||
        clicked.value !== undefined ||
        !isNumeric(clicked.column)
    ) {
        return [];
    }
    const { column } = clicked;

    return ["sum", "count"]
        .map(getAggregator)
        .filter((aggregator) => isCompatibleAggregatorForField(aggregator, column))
        .map(aggregator => ({
            name: "summarize-by-time",
            section: "sum",
            title: <span>{capitalize(aggregator.short)} by time</span>,
            question: () =>
                question
                    .summarize(
                        aggregator.requiresField
                            ? [aggregator.short, getFieldRefFromColumn(column)]
                            : [aggregator.short]
                    )
                    .pivot([
                        "datetime-field",
                        getFieldRefFromColumn(dateField),
                        "as",
                        "day"
                    ])
        }));
};
