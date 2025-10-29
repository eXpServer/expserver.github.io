#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

void printList(struct Node* head) {
    struct Node* current = head;
    printf("Attempting to print list:\n");
    
    while (current != NULL) {
        printf("%d -> ", current->data);
        current = current->next;
    }
    
    printf("NULL\n");
}

int main() {

    struct Node* head   = (struct Node*)malloc(sizeof(struct Node));
    struct Node* second = (struct Node*)malloc(sizeof(struct Node));
    struct Node* third  = (struct Node*)malloc(sizeof(struct Node));

    head->data = 10;
    head->next = second;

    second->data = 20;
    second->next = third;

    third->data = 30;
    
    third->next = second; 
    

    printf("Calling printList...\n");
    printList(head);

    printf("List printing complete.\n");

    free(head);
    free(second);
    free(third);

    return 0;
}